#!/usr/bin/env python3
"""Fetch and pre-filter security advisories from public sources.

Gathers advisories from the last N days (default: 1), applies coarse filters
(severity, exclusion keywords), and emits a JSON list on stdout for Claude to
semantically filter and summarise.

Sources:
- Ubuntu USN (https://ubuntu.com/security/notices.json)
- Debian Security Tracker (https://security-tracker.debian.org/tracker/data/json)
- GitHub Security Advisories (https://api.github.com/advisories)
- OpenCVE (https://app.opencve.io/api/cve)  — requires OPENCVE_API_TOKEN env var (Bearer)
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

EXCLUDE_PATTERN = re.compile(r"\b(php|apache(?!\s*kafka)|java(?!script))\b", re.IGNORECASE)
_TAG_RE = re.compile(r"<[^>]+>")
HIGH_SEVERITY = {"high", "critical"}
USER_AGENT = "security-check-skill/1.0 (+https://github.com/anthropics/claude-code)"
TIMEOUT = 15
MAX_RESULTS_PER_SOURCE = 50
TITLE_MAX = 200
SUMMARY_MAX = 500


def fetch(url: str, *, accept: str = "application/json", extra_headers: dict | None = None) -> bytes:
    headers = {"User-Agent": USER_AGENT, "Accept": accept}
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return resp.read()


def parse_iso(value: str) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def is_excluded(text: str) -> bool:
    return bool(EXCLUDE_PATTERN.search(text or ""))


def make_row(
    source: str,
    *,
    id: str | None,
    title: str,
    summary: str,
    cves: list[str],
    published: str | None,
    url: str | None,
    products: list[str],
    severity: str,
) -> dict:
    return {
        "source": source,
        "id": id,
        "title": title,
        "summary": summary,
        "cves": cves,
        "published": published,
        "url": url,
        "products": products,
        "severity": severity,
    }


def fetch_ubuntu(cutoff: datetime) -> list[dict]:
    try:
        data = json.loads(fetch("https://ubuntu.com/security/notices.json?release=jammy&order=newest"))
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        return [{"_error": f"ubuntu: {e}"}]
    out: list[dict] = []
    for n in data.get("notices", []):
        published = parse_iso(n.get("published", ""))
        if not published or published < cutoff:
            continue
        releases = n.get("release_packages", {}) or {}
        if releases and "jammy" not in releases:
            continue
        title = n.get("title", "")
        summary = n.get("summary", "")
        if is_excluded(f"{title} {summary}"):
            continue
        cves = n.get("cves_ids", []) or n.get("cves", [])
        out.append(make_row(
            "ubuntu-usn",
            id=n.get("id"),
            title=title,
            summary=summary,
            cves=cves if isinstance(cves, list) else [],
            published=n.get("published"),
            url=f"https://ubuntu.com/security/notices/{n.get('id')}",
            products=["Ubuntu 22.04"] if "jammy" in releases else list(releases.keys()),
            severity="unknown",  # USN doesn't ship a single severity
        ))
    return out


def fetch_debian(cutoff: datetime) -> list[dict]:
    """Debian Security Advisories via the official RSS feed (~22 KB vs ~73 MB JSON blob)."""
    _NS = {
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "rss": "http://purl.org/rss/1.0/",
        "dc":  "http://purl.org/dc/elements/1.1/",
    }
    try:
        xml_bytes = fetch("https://www.debian.org/security/dsa-long", accept="application/rss+xml, application/rdf+xml, */*")
    except urllib.error.URLError as e:
        return [{"_error": f"debian: {e}"}]
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        return [{"_error": f"debian: XML parse error: {e}"}]

    out: list[dict] = []
    for item in root.findall("rss:item", _NS):
        title       = (item.findtext("rss:title",       "", _NS) or "").strip()
        link        = (item.findtext("rss:link",        "", _NS) or "").strip()
        date_str    = (item.findtext("dc:date",         "", _NS) or "").strip()
        description = (item.findtext("rss:description", "", _NS) or "")

        if not date_str:
            continue
        try:
            pub_date = datetime.fromisoformat(date_str).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        # dc:date has no time component — compare dates to avoid same-day cutoff edge case
        if pub_date.date() < cutoff.date():
            continue

        if is_excluded(f"{title} {description}"):
            continue

        dsa_id = title.split()[0] if title.startswith("DSA-") else None
        tracker_match = re.search(r"https://security-tracker\.debian\.org/tracker/[^\s\"<]+", description)
        tracker_url = (
            tracker_match.group(0) if tracker_match
            else f"https://security-tracker.debian.org/tracker/{dsa_id}" if dsa_id
            else link
        )
        # CVEs are not embedded in the RSS body; extract any that appear anyway
        cves = re.findall(r"CVE-\d{4}-\d+", description)

        plain = _TAG_RE.sub("", description).strip()
        # drop the tracker URL that Debian appends to every description
        plain = re.sub(r"https://security-tracker\.debian\.org/tracker/\S+", "", plain).strip()

        out.append(make_row(
            "debian-dsa",
            id=dsa_id or link,
            title=title[:TITLE_MAX],
            summary=plain[:SUMMARY_MAX],
            cves=cves,
            published=date_str,
            url=tracker_url,
            products=["Debian Trixie"],
            severity="unknown",
        ))
    return out


def fetch_ghsa(cutoff: datetime) -> list[dict]:
    """GitHub Security Advisories — published in the lookback window, severity high/critical."""
    qs = urllib.parse.urlencode({
        "per_page": 100,
        "severity": "high",
        "published": f">{cutoff.strftime('%Y-%m-%dT%H:%M:%SZ')}",
    })
    try:
        data = json.loads(fetch(
            f"https://api.github.com/advisories?{qs}",
            accept="application/vnd.github+json",
        ))
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        return [{"_error": f"ghsa: {e}"}]
    out: list[dict] = []
    for adv in data:
        sev = (adv.get("severity") or "").lower()
        if sev not in HIGH_SEVERITY:
            continue
        summary = adv.get("summary", "")
        description = adv.get("description", "")
        if is_excluded(f"{summary} {description}"):
            continue
        ecosystems = sorted({
            (v.get("package") or {}).get("ecosystem", "")
            for v in adv.get("vulnerabilities", [])
            if v.get("package")
        })
        out.append(make_row(
            "ghsa",
            id=adv.get("ghsa_id"),
            title=summary,
            summary=description[:SUMMARY_MAX],
            cves=[c for c in [adv.get("cve_id")] if c],
            published=adv.get("published_at"),
            url=adv.get("html_url"),
            products=ecosystems,
            severity=sev,
        ))
    return out


def fetch_opencve(cutoff: datetime) -> list[dict]:
    """OpenCVE API — CVEs with CVSS ≥ 7.0 created within the lookback window.

    The listing endpoint doesn't return CVSS scores (server filters by `cvss=7`)
    and isn't strictly chronological; we filter client-side and walk up to
    OPENCVE_MAX_PAGES pages (default 5).
    """
    token = os.environ.get("OPENCVE_API_TOKEN")
    if not token:
        return [{"_error": "opencve: OPENCVE_API_TOKEN not set"}]
    max_pages = int(os.environ.get("OPENCVE_MAX_PAGES", "5"))
    auth_header = {"Authorization": f"Bearer {token}"}
    out: list[dict] = []
    for page in range(1, max_pages + 1):
        try:
            data = json.loads(fetch(
                f"https://app.opencve.io/api/cve?cvss=7&page={page}",
                extra_headers=auth_header,
            ))
        except urllib.error.HTTPError as e:
            return [{"_error": f"opencve: HTTP {e.code} on page {page}"}]
        except (urllib.error.URLError, json.JSONDecodeError) as e:
            return [{"_error": f"opencve: {e}"}]
        items = data.get("results", [])
        if not items:
            break
        for cve in items:
            cve_id = cve.get("cve_id") or cve.get("id")
            if not cve_id:
                continue
            published = parse_iso(cve.get("created_at") or cve.get("updated_at") or "")
            if not published or published < cutoff:
                continue
            description = cve.get("description") or cve.get("summary") or ""
            if is_excluded(description):
                continue
            out.append(make_row(
                "opencve",
                id=cve_id,
                title=description[:TITLE_MAX].strip(),
                summary=description[:SUMMARY_MAX].strip(),
                cves=[cve_id],
                published=cve.get("created_at"),
                url=f"https://app.opencve.io/cve/{cve_id}",
                products=[],
                severity="high",  # server-filtered cvss>=7; exact score via detail endpoint
            ))
            if len(out) >= MAX_RESULTS_PER_SOURCE:
                return out
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--days",
        type=int,
        default=1,
        help="Look back this many days from now (default: 1).",
    )
    args = parser.parse_args()
    if args.days < 1:
        parser.error("--days must be >= 1")
    cutoff = datetime.now(timezone.utc) - timedelta(days=args.days)

    sources = {
        "ubuntu": fetch_ubuntu,
        "debian": fetch_debian,
        "ghsa": fetch_ghsa,
        "opencve": fetch_opencve,
    }
    results: dict = {"cutoff": cutoff.isoformat(), "days": args.days}
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(sources)) as pool:
        futures = {name: pool.submit(fn, cutoff) for name, fn in sources.items()}
        for name, future in futures.items():
            results[name] = future.result()
    json.dump(results, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
