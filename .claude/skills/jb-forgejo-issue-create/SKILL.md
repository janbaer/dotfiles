---
name: forgejo-issue-create
model: haiku
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

Before asking any questions, list the repository's labels:

```
list_repo_labels(owner, repo)
```

Collect label names and their numeric IDs. Do not inspect issues for this: their bodies make the result huge.

> **Important:** Labels are passed to Forgejo as **numeric IDs**, not strings. Always resolve label names to IDs before creating the issue.

Every repository has Forgejo's default label set (`bug`, `enhancement`, `question`, …). Map IssueType `Bug` → `bug`, `Improvement` → `enhancement`, `Idea` → `idea`. `Idea`, `Future` and the Severity values get a label only where one with that name exists.

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
5. **Requirement** *(free text)* — only if `docs/requirements.md` exists in the repo, otherwise skip it. "Which requirement does this serve? Give the IDs (R3, R7), `New: <one sentence>` for a requirement that does not exist yet, or `None`." Show the existing requirements as a short list to choose from. Only the reference goes into the issue, never the text of an existing requirement: two copies drift apart.
6. **Acceptance Criteria** *(free text)* — "What checks must be fulfilled before this issue can be accepted? List them one per line."
   A step that lives on a host rather than in the repository (a cron job, an installed skill, a proxy route, an `.env` entry) is written as "created and verified by <who>", never as "documented". When the implementer cannot do it inside the change, the criterion names who does it after the merge. A documented-only cron job once left a whole automation idle on its first morning.
7. **How to Test** *(free text)* — "How can this be verified once implemented?"
8. **Hermes** *(single select)* — `Assign to hermes-agent` (Hermes implements it and opens the PR without asking) / `Leave for Claude`
9. **Ready** *(single select)* — only when the issue is left for Claude. `Ready` (Claude can start right away) / `Blocked` (an answer, a decision or another issue is still open; ask what, in one or two sentences)

**The Ready field (#9) is mandatory for every issue left for Claude.** `Blocked` sets the `blocked` label and posts what is open as a comment; `Ready` sets no label. Nothing goes into the body. An issue assigned to hermes-agent is never blocked: the assignment already means "start now", and an issue Hermes cannot start right away is not assigned to it. To hand an existing blocked issue to Hermes later, remove `blocked` first, then assign it.

Offer `Assign to hermes-agent` only when every check below passes. Otherwise skip #8, leave the issue for Claude, and say in one line which check failed.

- **Clear:** the issue has no open question, and the Requirement field is `None` or a reference to an existing ID (a `New:` requirement needs Jan). Hermes can ask for feedback, but an issue that depends on it is not ready.
- **Testable by Hermes:** every acceptance criterion has a check Hermes can run unattended in its worktree, such as a command, a test, an exit code or an HTTP status, and "How to Test" is a list of such commands. A database or an external service is fine when it can be mocked. A browser, a visual check, a human review, or anything that only exists on a host (a cron job, a proxy route, an `.env` entry, a restart) fails this. Special infrastructure counts as host state.
- **Agent files:** no acceptance criterion requires editing `CLAUDE.md`, `AGENTS.md` or anything under `.claude/`. Hermes is not allowed to touch them, and without this check it ships the PR with the criterion open. When the change needs such an edit, drop that point from the criteria and tell Jan it gets done at merge time.

The number of files, new dependencies and the like do not matter. A change to Hermes' own scripts or prompts is allowed too: it happens in a worktree and only takes effect after the merge, which needs two approvals.

When a check fails on a criterion Jan wants to keep for Hermes, name it and let him rewrite it, then check again.

If the `ntfy-me` skill is available, use it (topic: `claude`) to notify the user that input is needed before starting the questions.

### 5. Map Answers to Label IDs

Match the IssueType and Severity answers to numeric label IDs from step 2, and add the ID of `blocked` when field #9 is `Blocked`.

- If a matching label exists → use its numeric ID
- If no matching label exists → skip it (do not invent label names or IDs)

### 6. Review the Draft with Another Model

Before the preview, hand the drafted issue to a subagent on a model other than the one running this session (the system prompt names it): `Agent` with `subagent_type: "general-purpose"` and an explicit `model`, because a fresh agent inherits yours by default.

| This session runs on | Reviewer `model` |
| --- | --- |
| `sonnet`, `haiku` | `opus` |
| `opus` | `fable` |
| `fable` | `opus` |

Write the draft body to a scratchpad file and give the subagent that path plus the repository and the files the issue names. Give it the draft, not your reasoning or your conclusion, so it forms its own view. Tell it to stay read-only, to check the issue's claims against the code, and to report what is wrong, unclear, unverifiable or too large, each with a concrete failure scenario and the file behind it, ranked by severity, with unverified claims marked.

Weigh the findings yourself: fold the valid ones into the body, drop the rest, and say in the preview in one line which findings you took and which you did not. Several drafts created together go to one subagent. Jan can skip this step for a trivial issue.

### 7. Confirm Before Creating

Before calling `create_issue`, show the user a preview of the issue:

```
**Title:** {derived title}
**Labels:** {IssueType}, {Severity}, {blocked, if field #9 is Blocked}
**Assignee:** {hermes-agent | none}
**Body:**
{full rendered body}
```

Ask: "Does this look right? Shall I create the issue?"

Only proceed if the user confirms. If they want changes, update the relevant fields and re-show the preview.

### 8. Create the Issue

Build the issue body using **exactly** this template — do not add extra sections like "Steps to Reproduce" or "Expected Behavior":

```markdown
## Description

{Description}

## Motivation

{Motivation}

## Requirement

{Requirement — omit this whole section if docs/requirements.md does not exist}

## Acceptance Criteria

{AcceptanceCriteria — formatted as a markdown checklist, one item per line: `- [ ] item`}

## How to Test

{HowToTest}
```

Then create:

```
create_issue(
  owner, repo,
  title="{concise title derived from Description}",
  body="<body from template above>"
)
```

`create_issue` takes neither labels nor an assignee, so set both afterwards on the new issue number:

```
add_issue_labels(owner, repo, index=N, labels="<comma-separated IDs from step 5>")
create_issue_comment(owner, repo, index=N, body="Blocked: <what is open>")   # only if Blocked
update_issue(owner, repo, index=N, assignee="hermes-agent")   # only if assigned to Hermes
```

The assignment is what triggers Hermes. If `update_issue` fails, tell Jan: the issue exists but Hermes will not pick it up.

### 9. Notify When Done

Use the **ntfy-me** skill (if available) to notify with topic `claude`:
- Title: `Issue Created – #{N}: {title}`
- Body: link to the created issue

### 10. Ask Whether to Implement

If the issue is assigned to `hermes-agent`, stop here: Hermes picks it up. If it is `blocked`, stop here too: it is not ready.

Otherwise, always ask the user:

> "Issue #{N} created. Would you like to implement it now?"

Present two options:
- **Yes** → invoke the `forgejo-issue-implement` skill, passing the issue number
- **No** → stop; the workflow is complete

Do NOT start implementing unless the user explicitly selects Yes.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_issue` | Create the new issue |
| `list_repo_labels` | Discover label names and IDs |
| `add_issue_labels` | Apply labels after creation |
| `create_issue_comment` | Say what blocks a `blocked` issue |
| `update_issue` | Assign `hermes-agent` after creation |
