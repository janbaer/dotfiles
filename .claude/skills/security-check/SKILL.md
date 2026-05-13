---
name: security-check
description: Use to check for new critical Linux security advisories from public sources (Ubuntu USN, Debian Tracker, GitHub Advisories, OpenCVE) and print a concise summary to the terminal when relevant items are found. Use this skill whenever the user wants a daily security check, mentions "scan for CVEs", "check for security updates", "any new advisories", or schedules a recurring security review — even if they don't explicitly say "security-check".
model: sonnet
---

# security-check

Scans public security feeds for high/critical advisories from the last N days (default: 1) that affect Jan's stack, then prints a short markdown summary to the terminal. Quiet on a clean day, informative on a bad day.

## Argument

The skill accepts an optional `--days N` argument controlling the lookback window:

- `/security-check` → last 1 day (default)
- `/security-check --days 7` → last 7 days
- `/security-check 3` → last 3 days (bare integer also accepted; pass it through as `--days 3`)

Pass the value straight through to the fetcher.

## What counts as relevant

**Affected products (include only):**
- Debian Trixie
- Ubuntu 22.04 (jammy)
- Kubernetes / k3s
- Docker / containerd / runc
- Node.js (the runtime itself, not arbitrary npm packages — those are too noisy)
- MongoDB (the database server itself, not arbitrary drivers or ODM libraries)

**Severity:** Critical or High only. Medium/low get dropped.

**Always exclude:** advisories whose subject is PHP, Apache (the HTTP server or Tomcat), or Java/JVM. The pre-filter script drops obvious matches; you still need to apply judgement when a product is mentioned tangentially (e.g. an Ubuntu USN that fixes both PHP and OpenSSL — keep the OpenSSL part).

## How it works

The flow is: **fetcher script → semantic filter (you) → terminal output**.

1. Run the fetcher to get a JSON document with pre-filtered candidates from all four sources.
2. Read the candidates and apply the inclusion/exclusion rules above. The fetcher is conservative — it pulls anything that *might* match. Your job is to keep only items that genuinely affect Jan's stack at high/critical severity.
3. Build a markdown summary, max 15 lines, one bullet per finding.
4. Print the summary to the terminal.
5. If nothing matches, print a single line: `No high/critical advisories found.`

### Step 1: fetch

```bash
python3 ~/Projects/dotfiles/.claude/skills/security-check/scripts/fetch_advisories.py [--days N]
```

The script returns JSON with this shape:

```json
{
  "cutoff": "2026-05-09T...",
  "days": 1,
  "ubuntu": [{"source": "ubuntu-usn", "id": "USN-1234-1", "title": "...", "summary": "...", "cves": ["CVE-..."], "published": "...", "url": "...", "products": ["Ubuntu 22.04"], "severity": "unknown"}],
  "debian": [...],
  "ghsa": [...],
  "opencve": [...]
}
```

Notes on each source's pre-filter (lookback window = `--days`, default 1):

- **ubuntu**: only USNs that touch `jammy` (22.04) and were published within the lookback window. Severity comes as `unknown` because USN doesn't ship a single field — judge from the title. The `cves` field carries the underlying CVE IDs; prefer those over the USN ID when listing findings.
- **debian**: CVEs that are `open` in Trixie with `urgency` of `high` or `critical`. No timestamp — Debian's tracker doesn't publish per-CVE dates, so this is "currently open and high-urgency" regardless of `--days`. Treat it as a standing watchlist rather than fresh news.
- **ghsa**: GitHub advisories, severity high/critical, published within the lookback window. The `cves` field carries the underlying CVE ID; prefer that over the GHSA ID when listing findings. The `products` field carries the npm/maven/etc. ecosystem name — useful for Node.js relevance, but ignore non-relevant ecosystems (rubygems, composer, etc.).
- **opencve**: CVEs with CVSS ≥ 7.0 published within the lookback window. Requires the `OPENCVE_API_TOKEN` environment variable (sent as a Bearer token against `app.opencve.io`). If the token is missing, this source returns `_error` and the rest of the check continues normally. The `cvss` field carries the numeric score; severity is derived (≥9 → critical, ≥7 → high).

If a source returns `[{"_error": "..."}]`, that source failed (network, parse error). Mention it in the notification only if **all** sources failed; otherwise just note it briefly and continue with what you have.

### Step 2: semantic filter

For each candidate, ask: does this affect Debian Trixie, Ubuntu 22.04, Kubernetes, Docker, or Node.js, at high/critical severity? If unsure, lean toward **dropping** rather than including — Jan would rather miss a borderline item than get cried-wolf. Drop:

- npm package CVEs that aren't the Node.js runtime (e.g. `lodash` or `axios` advisories)
- Java/JVM/Tomcat/Apache HTTPD even when phrased without the keyword (e.g. "log4j", "Tomcat", "Spring")
- PHP frameworks (Laravel, Symfony, WordPress core/plugins)
- Windows-only or macOS-only items
- Non-security articles from Heise (general news, opinion pieces)

### Step 3: build the summary

Max 15 lines (15 bullets). Each bullet: severity tag, **CVE ID**, affected product, one-line note. Keep it scannable on a phone.

**ID rule:** Always prefer the CVE ID. Fall back to USN or GHSA **only** when no CVE is available for the finding.

- USN/GHSA with one or more CVEs in `cves`: show the CVE(s). If multiple CVEs map to the same advisory, list the primary one (or the most severe) and add `+N more` inline.
- USN/GHSA with empty `cves`: show the USN/GHSA ID as the fallback.
- OpenCVE entries are already CVE-keyed — use the ID as-is.

**Example:**

```markdown
- 🔴 **CVE-2026-12345** (containerd 1.7.x): privilege escalation via crafted image manifest. Patch in 1.7.20.
- 🟠 **CVE-2026-23273** (Ubuntu 22.04, Linux kernel, via USN-8255-1): memory corruption in network stack. Update available.
- 🟠 **CVE-2026-67890** (Node.js 20.x, via GHSA-abcd-1234): prototype pollution in url parser. Fixed in 20.18.2.
- 🟠 **GHSA-xyz9-1234-5678** (k3s plugin foo): no CVE assigned yet — auth bypass.
```

Use 🔴 for critical, 🟠 for high. If there are more than 15 hits, show the 15 most severe and append a final line `…and N more — see {topmost source URL}`.

If after filtering **nothing remains**, print: `No high/critical advisories found.`

### Step 4: print to terminal

Output the markdown summary directly. No external service calls needed.

## When all sources fail

If every source in the fetcher output contains `_error`, print:

```
Security check: all feed sources returned errors. Network or upstream issue.
```

Don't retry from inside the skill — cron will run again tomorrow.

## Why a hybrid script + LLM design

The fetcher handles the deterministic parts (HTTP, JSON parsing, date filtering, severity threshold, hard exclusions) because those are cheap, fast, and don't need a model. The semantic decisions ("is this Node.js runtime or just an npm package?", "is this Heise article about Kubernetes or about a Microsoft Exchange CVE?") need judgement, which is where you come in. This split keeps each cron run cheap and lets the script stay reusable if the rules change.
