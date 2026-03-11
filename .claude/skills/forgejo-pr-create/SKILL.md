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

### 4. Create the PR

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

### 5. Show the PR link

Output the URL of the newly created PR so the user can open it directly.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_pull_request` | Open a new PR |
| `get_issue_by_index` | Read issue title for PR title and link |
