---
name: security-check
description: Use to check for new critical Linux security advisories from public sources (Ubuntu USN, Debian Tracker, GitHub Advisories, Heise) and push a concise ntfy notification when relevant items are found. Designed for unattended cron-style runs (e.g. once daily). Use this skill whenever the user wants a daily security check, mentions "scan for CVEs", "check for security updates", "any new advisories", or schedules a recurring security review — even if they don't explicitly say "security-check".
model: sonnet
---

# security-check

Scans public security feeds for high/critical advisories from the last 24 hours that affect Jan's stack, then pushes a short markdown summary to ntfy. Built to run unattended via cron — quiet on a clean day, informative on a bad day.

## What counts as relevant

**Affected products (include only):**
- Debian Trixie
- Ubuntu 22.04 (jammy)
- Kubernetes / k3s
- Docker / containerd / runc
- Node.js (the runtime itself, not arbitrary npm packages — those are too noisy)

**Severity:** Critical or High only. Medium/low get dropped.

**Always exclude:** advisories whose subject is PHP, Apache (the HTTP server or Tomcat), or Java/JVM. The pre-filter script drops obvious matches; you still need to apply judgement when a product is mentioned tangentially (e.g. an Ubuntu USN that fixes both PHP and OpenSSL — keep the OpenSSL part).

## How it works

The flow is: **fetcher script → semantic filter (you) → ntfy notification**.

1. Run the fetcher to get a JSON document with pre-filtered candidates from all four sources.
2. Read the candidates and apply the inclusion/exclusion rules above. The fetcher is conservative — it pulls anything that *might* match. Your job is to keep only items that genuinely affect Jan's stack at high/critical severity.
3. Build a markdown summary, max 5 lines, one bullet per finding.
4. Send via the `ntfy` CLI (see "Sending the notification" below).
5. If nothing matches, exit silently — no notification. Cron should not produce daily noise on clean days.

### Step 1: fetch

```bash
python3 ~/Projects/dotfiles/.claude/skills/security-check/scripts/fetch_advisories.py
```

The script returns JSON with this shape:

```json
{
  "cutoff": "2026-05-09T...",
  "ubuntu": [{"source": "ubuntu-usn", "id": "USN-1234-1", "title": "...", "summary": "...", "cves": ["CVE-..."], "published": "...", "url": "...", "products": ["Ubuntu 22.04"], "severity": "unknown"}],
  "debian": [...],
  "ghsa": [...],
  "heise": [...]
}
```

Notes on each source's pre-filter:

- **ubuntu**: only USNs that touch `jammy` (22.04) and were published in the last 24h. Severity comes as `unknown` because USN doesn't ship a single field — judge from the title.
- **debian**: CVEs that are `open` in Trixie with `urgency` of `high` or `critical`. No timestamp — Debian's tracker doesn't publish per-CVE dates, so this is "currently open and high-urgency", not strictly "last 24h". Treat it as a standing watchlist rather than fresh news.
- **ghsa**: GitHub advisories, severity high/critical, published in the last 24h. The `products` field carries the npm/maven/etc. ecosystem name — useful for Node.js relevance, but ignore non-relevant ecosystems (rubygems, composer, etc.).
- **heise**: prose articles in the last 24h. No structured severity. Read the title/summary and judge — if it's clearly about a high-impact issue affecting one of the listed products, keep it; otherwise drop.

If a source returns `[{"_error": "..."}]`, that source failed (network, parse error). Mention it in the notification only if **all** sources failed; otherwise just note it briefly and continue with what you have.

### Step 2: semantic filter

For each candidate, ask: does this affect Debian Trixie, Ubuntu 22.04, Kubernetes, Docker, or Node.js, at high/critical severity? If unsure, lean toward **dropping** rather than including — Jan would rather miss a borderline item than get cried-wolf. Drop:

- npm package CVEs that aren't the Node.js runtime (e.g. `lodash` or `axios` advisories)
- Java/JVM/Tomcat/Apache HTTPD even when phrased without the keyword (e.g. "log4j", "Tomcat", "Spring")
- PHP frameworks (Laravel, Symfony, WordPress core/plugins)
- Windows-only or macOS-only items
- Non-security articles from Heise (general news, opinion pieces)

### Step 3: build the summary

Max 5 lines (5 bullets). Each bullet: severity tag, CVE/USN/GHSA id, affected product, one-line note. Keep it scannable on a phone.

**Example:**

```markdown
- 🔴 **CVE-2026-12345** (containerd 1.7.x): privilege escalation via crafted image manifest. Patch in 1.7.20.
- 🟠 **USN-7890-1** (Ubuntu 22.04, openssl): memory corruption in DTLS handshake. Update available.
- 🟠 **GHSA-abcd-1234** (Node.js 20.x): prototype pollution in url parser. Fixed in 20.18.2.
```

Use 🔴 for critical, 🟠 for high. If there are more than 5 hits, show the 5 most severe and append a final line `…and N more — see {topmost source URL}`.

If after filtering **nothing remains**, exit without sending.

### Step 4: send via the ntfy-me skill

Delegate the actual send to the **`ntfy-me`** skill — it owns the CLI flags, server URL, tag vocabulary, and common-mistake guardrails. This skill only specifies *what* to send, not *how*. Read `ntfy-me`'s SKILL.md if you need the exact flag reference; the parameters this skill needs are:

| Parameter   | Value |
|-------------|-------|
| `--title`   | `Linux Security Update` |
| `--topic`   | `security-issues` (fixed — Jan's dedicated channel for this skill) |
| `--tags`    | `warning,shield` (names, not emoji characters) |
| `--priority`| `high` (these are critical/high CVEs and should bypass Do Not Disturb) |
| `--markdown`| on (summary uses bullets and bold) |
| body        | the markdown summary from step 3 |

## When all sources fail

If every source in the fetcher output contains `_error`, delegate one low-priority send via `ntfy-me` so Jan knows the check ran but couldn't reach upstream:

| Parameter | Value |
|-----------|-------|
| `--title` | `Linux Security Update — sources unreachable` |
| `--topic` | `security-issues` |
| `--tags`  | `x` |
| `--priority` | `low` |
| body | `All four feed sources returned errors. Network or upstream issue.` |

Don't retry from inside the skill — cron will run again tomorrow.

## Why a hybrid script + LLM design

The fetcher handles the deterministic parts (HTTP, JSON parsing, date filtering, severity threshold, hard exclusions) because those are cheap, fast, and don't need a model. The semantic decisions ("is this Node.js runtime or just an npm package?", "is this Heise article about Kubernetes or about a Microsoft Exchange CVE?") need judgement, which is where you come in. This split keeps each cron run cheap and lets the script stay reusable if the rules change.
