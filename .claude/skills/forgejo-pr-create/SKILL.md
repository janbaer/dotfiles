---
name: forgejo-pr-create
description: Use when creating a Pull Request on a Forgejo repository. Trigger on phrases like "create a PR", "open a PR", "submit a PR", "make a pull request", "create PR for issue #N", or "create PR for the current branch".
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**.

# Forgejo PR Creation

Creates a Pull Request for the current branch on a Forgejo repository.

## Steps

### 1. Detect repo and branch

```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"

git branch --show-current
# current feature branch
```

### 2. Confirm base branch

```bash
git remote show origin | grep "HEAD branch"
# typically "main"
```

### 3. Derive title and issue link

**If on a `feature/{N}-{slug}` branch:**

```
get_issue_by_index(owner, repo, index=N)
```

Use the issue title as the PR title and include `closes #N` in the body.

**If not on a feature branch or no issue number in branch name:**

Derive a title from the branch name or recent commits. Do not include `closes #N`.

### 4. Check for implementation deviations

Compare the actual implementation (commits, code changes) against the issue description, acceptance criteria, and "How to Test" scenarios fetched in step 3.

Look for decisions made during implementation that contradict or significantly differ from what was defined in the issue — for example:
- A different technical approach than described
- Acceptance criteria that were changed, dropped, or reinterpreted
- "How to Test" steps that no longer match the actual behavior
- Scope that was added or removed without being reflected in the issue

**If deviations are found:**

Update the issue body to reflect what was actually built:

```
update_issue(owner, repo, index=N, body="<updated body>")
```

Keep the original structure — only update the sections that differ. Add a short note at the bottom of the affected section explaining what changed and why, so reviewers understand the decision.

**If no deviations are found:** proceed directly to PR creation.

### 5. Create the PR

```
create_pull_request(
  owner, repo,
  title="<title>",
  head="<current-branch>",
  base="<base-branch>",
  body="<body>"
)
```

PR body structure:

```markdown
## Summary

<1–3 bullet points describing what this PR does>

## How to Test

<steps to verify the change works>

closes #N   ← only if an issue is linked
```

- Do **not** call `issue_state_change` manually — Forgejo closes the issue automatically on merge.

### 6. Show the PR link

Output the URL of the newly created PR so the user can open it directly.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_pull_request` | Open a new PR |
| `get_issue_by_index` | Read issue details for title, link, and deviation check |
| `update_issue` | Update issue body if implementation deviated from spec |
