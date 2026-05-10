#!/usr/bin/env python3
"""Fetch and pre-filter security advisories from public sources.

Gathers advisories from the last 24h, applies coarse filters (severity,
exclusion keywords), and emits a JSON list on stdout for Claude to
semantically filter and summarise.

Sources:
- Ubuntu USN (https://ubuntu.com/security/notices.json)
- Debian Security Tracker (https://security-tracker.debian.org/tracker/data/json)
- GitHub Security Advisories (https://api.github.com/advisories)
- Heise Security RSS (https://www.heise.de/security/rss/news-atom.xml)
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

CUTOFF = datetime.now(timezone.utc) - timedelta(hours=24)
EXCLUDE_PATTERN = re.compile(r"\b(php|apache(?!\s*kafka)|java(?!script))\b", re.IGNORECASE)
HIGH_SEVERITY = {"high", "critical"}
USER_AGENT = "security-check-skill/1.0 (+https://github.com/anthropics/claude-code)"
TIMEOUT = 15


def fetch(url: str, accept: str = "application/json") -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": accept})
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


def fetch_ubuntu() -> list[dict]:
    out: list[dict] = []
    try:
        data = json.loads(fetch("https://ubuntu.com/security/notices.json?release=jammy&order=newest"))
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        return [{"_error": f"ubuntu: {e}"}]
    for n in data.get("notices", []):
        published = parse_iso(n.get("published", ""))
        if not published or published < CUTOFF:
            continue
        # API filters by release; defensively re-check
        releases = n.get("release_packages", {}) or {}
        if releases and "jammy" not in releases:
            continue
        title = n.get("title", "")
        summary = n.get("summary", "")
        if is_excluded(f"{title} {summary}"):
            continue
        cves = n.get("cves_ids", []) or n.get("cves", [])
        out.append({
            "source": "ubuntu-usn",
            "id": n.get("id"),
            "title": title,
            "summary": summary,
            "cves": cves if isinstance(cves, list) else [],
            "published": n.get("published"),
            "url": f"https://ubuntu.com/security/notices/{n.get('id')}",
            "products": ["Ubuntu 22.04"] if "jammy" in releases else list(releases.keys()),
            "severity": "unknown",  # USN doesn't ship a single severity
        })
    return out


def fetch_debian() -> list[dict]:
    """Debian's tracker JSON is large (~50MB). We pull the recent CVE list instead."""
    out: list[dict] = []
    try:
        # Smaller endpoint: list of recent CVEs as plain text
        raw = fetch("https://security-tracker.debian.org/tracker/data/json").decode("utf-8")
        data = json.loads(raw)
    except (urllib.error.URLError, json.JSONDecodeError, MemoryError) as e:
        return [{"_error": f"debian: {e}"}]

    # Walk packages; keep entries that affect trixie and have a recent debianbug or release info.
    # Debian's JSON has no per-CVE timestamp, so we approximate "recent" via "open in trixie".
    for pkg, cves in data.items():
        if is_excluded(pkg):
            continue
        for cve_id, info in cves.items():
            releases = info.get("releases", {})
            trixie = releases.get("trixie")
            if not trixie:
                continue
            if trixie.get("status") != "open":
                continue
            urgency = (trixie.get("urgency") or "").lower()
            # Debian "urgency" maps roughly: high/critical → high; medium/low/unimportant → skip
            if urgency not in {"high", "critical"}:
                continue
            description = info.get("description", "")
            if is_excluded(description):
                continue
            out.append({
                "source": "debian-tracker",
                "id": cve_id,
                "title": f"{cve_id} ({pkg})",
                "summary": description,
                "cves": [cve_id],
                "published": None,  # tracker has no timestamp; user accepts this
                "url": f"https://security-tracker.debian.org/tracker/{cve_id}",
                "products": [f"Debian Trixie ({pkg})"],
                "severity": urgency,
            })
            if len(out) >= 50:
                return out
    return out


def fetch_ghsa() -> list[dict]:
    """GitHub Security Advisories — published in the last 24h, severity high/critical."""
    out: list[dict] = []
    cutoff_iso = CUTOFF.strftime("%Y-%m-%dT%H:%M:%SZ")
    url = (
        "https://api.github.com/advisories"
        f"?per_page=100&severity=high&published=%3E{cutoff_iso}"
    )
    try:
        data = json.loads(fetch(url, accept="application/vnd.github+json"))
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        return [{"_error": f"ghsa: {e}"}]

    for adv in data:
        sev = (adv.get("severity") or "").lower()
        if sev not in HIGH_SEVERITY:
            continue
        summary = adv.get("summary", "")
        description = adv.get("description", "")
        text = f"{summary} {description}"
        if is_excluded(text):
            continue
        # Capture ecosystem hints — Claude will judge K8s/Docker/Node relevance
        ecosystems = sorted({
            (v.get("package") or {}).get("ecosystem", "")
            for v in adv.get("vulnerabilities", [])
            if v.get("package")
        })
        out.append({
            "source": "ghsa",
            "id": adv.get("ghsa_id"),
            "title": summary,
            "summary": description[:500],
            "cves": [c for c in [adv.get("cve_id")] if c],
            "published": adv.get("published_at"),
            "url": adv.get("html_url"),
            "products": ecosystems,
            "severity": sev,
        })
    return out


def fetch_heise() -> list[dict]:
    out: list[dict] = []
    try:
        raw = fetch("https://www.heise.de/security/rss/news-atom.xml", accept="application/atom+xml")
    except urllib.error.URLError as e:
        return [{"_error": f"heise: {e}"}]
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as e:
        return [{"_error": f"heise-parse: {e}"}]

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    for entry in root.findall("atom:entry", ns):
        updated = parse_iso((entry.findtext("atom:updated", default="", namespaces=ns) or ""))
        if not updated or updated < CUTOFF:
            continue
        title = (entry.findtext("atom:title", default="", namespaces=ns) or "").strip()
        summary = (entry.findtext("atom:summary", default="", namespaces=ns) or "").strip()
        if is_excluded(f"{title} {summary}"):
            continue
        link_el = entry.find("atom:link", ns)
        url = link_el.get("href") if link_el is not None else None
        out.append({
            "source": "heise",
            "id": entry.findtext("atom:id", default="", namespaces=ns),
            "title": title,
            "summary": summary,
            "cves": [],
            "published": entry.findtext("atom:updated", default="", namespaces=ns),
            "url": url,
            "products": [],
            "severity": "unknown",  # Heise prose; Claude judges relevance
        })
    return out


def main() -> int:
    results = {
        "cutoff": CUTOFF.isoformat(),
        "ubuntu": fetch_ubuntu(),
        "debian": fetch_debian(),
        "ghsa": fetch_ghsa(),
        "heise": fetch_heise(),
    }
    json.dump(results, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
