---
name: security-advisory-triage
description: Parses security vulnerability reports in Slack bot format (entries with Severity/Package/Identifiers and emoji severity markers like `:red_circle:`, `:large_orange_circle:`) into a deduped table, fetches GitHub advisory descriptions, checks for existing Jira tickets, then creates new Jira tickets under the security parent epic. Trigger when the user provides a security.txt or security report file, pastes Slack security bot alerts, says "parse security report", "process vulnerability alerts", "security advisory report", "create jira tickets for security issues", or shares any file containing GHSA identifiers with Package/Severity entries.
---

Triage a security vulnerability report: parse, deduplicate, look up advisories, check Jira, create tickets.

## Input format

The report contains entries like this (often with repository/filepath headers mixed in):

```
Repository: bu-example-service
Filepath: yarn.lock

Severity: :red_circle: CRITICAL
Package: sanitize-html
Identifiers: GHSA-rpr9-rxv7-x643

Severity: :large_orange_circle: HIGH
Package: json5
Identifiers: GHSA-9c47-m6qq-7p4h, GHSA-other-id-here
```

Emoji → severity mapping:
- `:red_circle:` → CRITICAL
- `:large_orange_circle:` → HIGH
- `:large_yellow_circle:` → MEDIUM

## Step 1: Parse and deduplicate

Read the file (the user will provide a path) or parse pasted content.

For each block that contains `Severity:`, `Package:`, and `Identifiers:`, extract those three fields plus the `Repository:` line that precedes it (if present).

**Deduplicate by package name** — the same package often appears across many repos:
- Keep the **highest** severity (CRITICAL > HIGH > MEDIUM)
- Merge all GHSA identifiers into a single deduplicated list
- Note all affected repositories (informational only)

## Step 2: Fetch advisory details

For each unique package, fetch the GitHub Advisory API (JSON, no auth required):
`https://api.github.com/advisories/{GHSA-ID}`

Extract these four fields from the JSON response:
1. **Short description** — `.summary` field
2. **Affected versions** — all `.vulnerabilities[].vulnerable_version_range` values
3. **Patched versions** — all `.vulnerabilities[].first_patched_version` values (deduplicated)
4. **CVSS score** — `.cvss.score` (e.g. `7.5 / 10`)

Fetch in parallel for all packages to save time. If a fetch fails, mark missing fields as `N/A`.

## Step 3: Search for existing Jira tickets

For each unique package, search Jira for open issues using `mcp__jira-mcp__jira-search-issues`:

```
project = VERBU AND summary ~ "{package-name}" AND status != Done ORDER BY created DESC
```

Run all searches in parallel. For each package note:
- **Open ticket found** → record the issue key (e.g. `VERBU-12345`) — skip ticket creation for this package
- **Only closed tickets or none** → mark as `None` — candidate for ticket creation

## Step 4: Display the summary table

Show a markdown table sorted by severity (CRITICAL first, then HIGH, then MEDIUM):

| Package | Severity | Identifiers | Advisory Description | Existing Ticket |
|---------|----------|-------------|----------------------|-----------------|
| sanitize-html | CRITICAL | [GHSA-rpr9-rxv7-x643](https://github.com/advisories/GHSA-rpr9-rxv7-x643) | Improper input validation... | None |
| json5 | HIGH | [GHSA-9c47-m6qq-7p4h](https://github.com/advisories/GHSA-9c47-m6qq-7p4h) | Prototype pollution... | [VERBU-1234](https://c24-vorsorge.atlassian.net/browse/VERBU-1234) |

Make each GHSA identifier and each ticket key a clickable link.

After the table show a one-line summary:
> `{N} unique packages — {X} already have open tickets, {Y} are new.`

Then ask: **"Should I create Jira tickets for all {Y} new packages?"**

Wait for the user's answer. If yes, proceed directly to step 5 without any further per-ticket confirmation.

## Step 5: Create all tickets

Create tickets for all new packages in order (CRITICAL → HIGH → MEDIUM) without stopping to ask for each one. Use `mcp__jira-mcp__jira-create-issue` with these fields:
- **Summary**: `Security | {package-name} - {Severity} Severity`
- **Description**: Use ADF format (not plain text) so identifiers render as real hyperlinks. Structure:
  1. Paragraph: short advisory description
  2. Paragraph: `Affected versions: ...`
  3. Paragraph: `Patched versions: ...`
  4. Paragraph: `CVSS score: x.x / 10`
  5. Paragraph: `Identifiers:`
  6. bulletList: one listItem per GHSA ID, each a paragraph with a single text node carrying a `link` mark:
     `{"type":"text","text":"GHSA-xxx-yyy-zzz","marks":[{"type":"link","attrs":{"href":"https://github.com/advisories/GHSA-xxx-yyy-zzz"}}]}`
- **parentKey**: `VERBU-25054` (the security epic)
- **Priority**: map from severity:
  - CRITICAL → Critical
  - HIGH → High
  - MEDIUM → Medium
  - LOW → Low
- **Issue type**: Task (or Story — whichever the Jira project defaults to)

After all tickets are created, show a summary list:

```
Created tickets:
- [VERBU-XXXXX](https://c24-vorsorge.atlassian.net/browse/VERBU-XXXXX) — {package-name} ({Severity})
- [VERBU-YYYYY](https://c24-vorsorge.atlassian.net/browse/VERBU-YYYYY) — {package-name} ({Severity})
```

## Notes

- If the user specifies a different parent issue than VERBU-25054, use that instead.
- Step 4 asks once for all packages; the user is the final authority on which packages to skip.
