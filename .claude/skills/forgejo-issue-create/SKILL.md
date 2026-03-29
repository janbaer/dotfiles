---
name: forgejo-issue-create
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

### 3. Explore the Issue with grill-me

Invoke the `grill-me` skill to deeply explore the topic before collecting the formal fields. Tell it:

> "We are gathering context for a Forgejo issue. Do NOT ask at the end whether to create a Forgejo issue — that will be handled automatically after this interview."

Use the interview to surface motivation, edge cases, design decisions, and acceptance criteria. This context will inform the answers to the structured questions below.

### 4. Ask Structured Questions

Use the `AskUserQuestion` tool to collect each field **one at a time**, in the order below. For fields with predefined options, present them as a selection list. For free-text fields, ask an open question.

**Field order:**

1. **Description** *(free text)* — "What is the issue about?" *(the title will be derived from this)*
2. **IssueType** *(single select)* — `Bug` / `Improvement` / `Idea` / `Future`
3. **Severity** *(single select)* — `Minor` / `Medium` / `High` / `Critical`
4. **Motivation** *(free text)* — "Why does this matter? What problem does it solve?"
5. **Acceptance Criteria** *(free text)* — "What checks must be fulfilled before this issue can be accepted? List them one per line."
6. **How to Test** *(free text)* — "How can this be verified once implemented?"
7. **Claude** *(single select)* — `Needs feedback first` (stop and ask before implementing) / `Auto-implement` (Claude can start right away)

**The Claude field (#7) is mandatory.** Never skip it. It controls whether future agents can auto-implement or must pause for input.

If the `ntfy-me` skill is available, use it (topic: `claude`) to notify the user that input is needed before starting the questions.

### 5. Map Answers to Label IDs

Match the IssueType and Severity answers to numeric label IDs from step 2.

- If a matching label exists → use its numeric ID
- If no matching label exists → skip it (do not invent label names or IDs)

### 6. Confirm Before Creating

Before calling `create_issue`, show the user a preview of the issue:

```
**Title:** {derived title}
**Labels:** {IssueType}, {Severity}
**Body:**
{full rendered body}
```

Ask: "Does this look right? Shall I create the issue?"

Only proceed if the user confirms. If they want changes, update the relevant fields and re-show the preview.

### 7. Create the Issue

Build the issue body using **exactly** this template — do not add extra sections like "Steps to Reproduce" or "Expected Behavior":

```markdown
## Description

{Description}

## Motivation

{Motivation}

## Acceptance Criteria

{AcceptanceCriteria — formatted as a markdown checklist, one item per line: `- [ ] item`}

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

### 8. Notify When Done

Use the **ntfy-me** skill (if available) to notify with topic `claude`:
- Title: `Issue Created – #{N}: {title}`
- Body: link to the created issue

### 9. Ask Whether to Implement

After notifying, always ask the user:

> "Issue #{N} created. Would you like to implement it now?"

Present two options:
- **Yes** → invoke the `forgejo-issue-implement` skill, passing the issue number
- **No** → stop; the workflow is complete

Do NOT start implementing unless the user explicitly selects Yes.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_issue` | Create the new issue |
| `list_repo_issues` | Inspect existing issues to discover label names and IDs |
| `add_issue_labels` | Apply labels after creation if needed |
