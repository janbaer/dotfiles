---
name: forgejo-create-issue
description: Use when creating a new issue on a Forgejo repository - guiding the user through structured questions about the issue type, severity, motivation, and testing approach before submitting. Trigger on phrases like "create issue", "file an issue", "open a ticket", "report a bug", or "add an issue".
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**. Do NOT attempt workarounds such as REST API calls, curl, or any other method — the MCP server is the only supported interface.

# Forgejo Issue Creation

Uses the `forgejo-mcp` MCP server to create issues on any Forgejo project.

## Workflow

### 1. Detect Repo

Derive owner and repo from git remote, never hardcode:

```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"
```

### 2. Fetch Available Labels

Before asking any questions, fetch label IDs by inspecting a sample of open issues:

```
list_repo_issues(owner, repo, type="issues", state="open")
```

Collect label names and their numeric IDs from the results.

> **Important:** Labels are passed to Forgejo as **numeric IDs**, not strings. Always resolve label names to IDs before creating the issue.

If no labels can be discovered, create the issue without labels.

### 3. Ask Structured Questions

Ask the user **all questions at once** in a single message — never spread across multiple round-trips. Do NOT ask for a title — derive it from the Description.

**REQUIRED fields — you MUST ask all 6, in this order:**

| # | Field | Options / Format |
|---|-------|-----------------|
| 1 | **Description** | What is the issue about? (free text — title will be derived from this) |
| 2 | **IssueType** | `Bug` / `Improvement` / `Idea` / `Future` |
| 3 | **Severity** | `Minor` / `Medium` / `High` / `Critical` |
| 4 | **Motivation** | Why does this matter? What problem does it solve? (free text) |
| 5 | **Claude** | `Needs feedback first` (stop and ask before implementing) / `Auto-implement` (Claude can start right away) |
| 6 | **How to test** | How can this be verified once implemented? (free text) |

**The Claude field (#5) is mandatory.** Never skip it. It controls whether future agents can auto-implement or must pause for input.

Example prompt to the user:

> I need a few details to create the issue. Please fill in:
>
> 1. **Description**: What is the issue about?
> 2. **IssueType**: Bug / Improvement / Idea / Future
> 3. **Severity**: Minor / Medium / High / Critical
> 4. **Motivation**: Why does this matter?
> 5. **Claude**: Needs feedback first — or — Auto-implement?
> 6. **How to test**: How can this be verified once done?

If the `ntfy-me` skill is available, use it (topic: `claude`) to notify the user that input is needed.

### 4. Map Answers to Label IDs

Match the IssueType and Severity answers to numeric label IDs from step 2.

- If a matching label exists → use its numeric ID
- If no matching label exists → skip it (do not invent label names or IDs)

### 5. Create the Issue

Build the issue body using **exactly** this template — do not add extra sections like "Steps to Reproduce" or "Expected Behavior":

```markdown
## Description

{Description}

## Motivation

{Motivation}

## How to Test

{HowToTest}

## Implementation

Claude: {Needs feedback first | Auto-implement}
```

Then create:

```
create_issue(
  owner, repo,
  title="{concise title derived from Description}",
  body="<body from template above>",
  labels=[<numeric IDs from step 4>]
)
```

### 6. Notify When Done

Use the **ntfy-me** skill (if available) to notify with topic `claude`:
- Title: `Issue Created – #{N}: {title}`
- Body: link to the created issue

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_issue` | Create the new issue |
| `list_repo_issues` | Inspect existing issues to discover label names and IDs |
| `add_issue_labels` | Apply labels after creation if needed |
