---
name: forgejo-pr
description: Use when creating, listing, or inspecting Pull Requests on a Forgejo repository using the forgejo-mcp MCP server.
---

# Forgejo Pull Request Management

Uses the `forgejo-mcp` MCP server (configured globally in `~/.claude.json`) to create and manage PRs on any Forgejo project.

## Detect Repo

Always derive owner and repo from git remote, never hardcode:

```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"
```

## Creating a PR

Ensure all changes are committed and pushed to the feature branch, then:

```
create_pull_request(
  owner, repo,
  title="feat: short description",
  head="feature/my-branch",
  base="main",
  body="..."  ← see references/pr_templates.md for body structure by PR type
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

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_pull_request` | Open a new PR |
| `list_repo_pull_requests` | Browse open/closed PRs |
| `get_pull_request_by_index` | Read PR details |
| `add_issue_labels` | Label a PR |

## If MCP Tools Are Unavailable

> The `forgejo-mcp` MCP server is not active. Restart Claude Code — it is configured in `~/.claude.json` using the wrapper at `~/Projects/dotfiles/bin/forgejo-mcp-wrapper`.
