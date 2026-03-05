---
name: forgejo-pr
description: Use when creating, listing, or inspecting Pull Requests on a Forgejo repository using the forgejo-mcp MCP server. Trigger on phrases like "open a PR", "submit a PR", "make a pull request", "push a PR", or "create a pull request".
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**. Do NOT attempt workarounds such as REST API calls, curl, or any other method — the MCP server is the only supported interface.

# Forgejo Pull Request Management

Uses the `forgejo-mcp` MCP server (configured globally in `~/.claude.json`) to create and manage PRs on any Forgejo project.

## Creating a PR

### 1. Detect repo

Derive owner and repo from git remote, never hardcode:

```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"
```

### 2. Confirm base branch

Check the current branch and confirm the target base — typically `main`, but verify:

```bash
git remote show origin | grep "HEAD branch"
```

### 3. Create the PR

Ensure all changes are committed and pushed to the feature branch, then:

```
create_pull_request(
  owner, repo,
  title="feat: short description",
  head="feature/my-branch",
  base="main",            ← use the base branch confirmed in step 2
  body="..."              ← see references/pr_templates.md for body structure by PR type
)
```

- Use `closes #N` in the body to auto-close the related issue on merge
- Do **not** call `issue_state_change` manually — the merge handles closure

## Listing PRs

```
list_repo_pull_requests(owner, repo, state="open")
```

Use `state="closed"` or `state="all"` as needed.

## Inspecting a PR

```
get_pull_request_by_index(owner, repo, index=N)
```

## Adding Labels

```
add_issue_labels(owner, repo, index=N, labels="enhancement,needs-review")
```

Note: In Forgejo, PRs are treated as a type of issue internally, so `add_issue_labels` works for both.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_pull_request` | Open a new PR |
| `list_repo_pull_requests` | Browse open/closed PRs |
| `get_pull_request_by_index` | Read PR details |
| `add_issue_labels` | Label a PR (works because PRs are issues in Forgejo) |
