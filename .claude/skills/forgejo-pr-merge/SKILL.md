---
name: forgejo-pr-merge
description: Use when merging (closing) a Pull Request on a Forgejo repository via squash commit. Trigger on phrases like "merge this PR", "merge a PR", "close this PR", "close the PR", "merge PR #N", "squash and merge", or "land this PR". Always use this skill when the user wants to merge or close a PR — even if they don't explicitly say "squash".
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**.

# Forgejo PR Merge

Merges a Pull Request using a squash commit, then cleans up the branch locally.

## Steps

### 1. Detect repo

```bash
git remote get-url origin
# https://forgejo.example.com/owner/repo.git → owner="owner", repo="repo"
```

### 2. Determine which PR to merge

**If a PR number was passed as an argument** — use it directly.

**If on a feature branch** — check whether a PR exists for the current branch:

```bash
git branch --show-current
```

```
list_repo_pull_requests(owner, repo, state="open")
```

Look for a PR whose `head` matches the current branch. If found, use it.

**If no PR can be determined from context** — list open PRs and ask the user to pick one:

```
list_repo_pull_requests(owner, repo, state="open")
```

Show: `#N — <title> (<head> → <base>)` and wait for selection.

### 3. Read PR details

```
get_pull_request_by_index(owner, repo, index=N)
```

Note the **base branch** — this is where the squash commit will land. It is usually `main` or `master`, but may be another feature branch. Confirm with the user if it looks unexpected (e.g. not `main`/`master`).

Show the user a short summary:

```
PR #N: <title>
<head> → <base>
<PR URL>
```

**Ask for confirmation only if the PR was inferred from context** (matched automatically from the current branch) — not if the user explicitly passed a PR number or selected one from the list. If asking: "Merge this PR?" and wait for confirmation.

### 4. Merge with squash commit

```
merge_pull_request(
  owner, repo,
  index=N,
  style="squash",
  title="<PR title>",
  delete_branch_after_merge=true
)
```

Passing `delete_branch_after_merge=true` lets Forgejo delete the remote branch server-side. Forgejo also closes the PR and — if the PR body contains `closes #N` — automatically closes the linked issue.

### 5. Clean up local branch

Switch to the base branch and delete the feature branch locally:

```bash
git checkout <base-branch>
git pull
git branch -D <head-branch>
```

Force-delete (`-D`) is used because the squash commit rewrites history and git won't consider the local branch "fully merged".

### 6. Notify

Invoke the `ntfy-me` skill with a message summarising what was merged:

> Merged PR #N: _\<title\>_ into `<base-branch>` on `<repo>`

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs when none is specified |
| `get_pull_request_by_index` | Read PR details (title, head, base, body) |
| `merge_pull_request` | Squash-merge the PR |
