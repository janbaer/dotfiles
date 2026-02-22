---
name: forgejo-review-pr
description: Use when reviewing an open Pull Request on a Forgejo repository - reading changes, leaving comments, or labelling the outcome.
---

# Forgejo Pull Request Review

Uses the `forgejo-mcp` MCP server and git to review PRs on any Forgejo project.

**REQUIRED SUB-SKILL:** Use `code-review-excellence` for the actual review process — feedback quality, severity labels, checklists, and templates. This skill handles only the Forgejo-specific parts.

Installation with: `npx skills add https://github.com/wshobson/agents --skill code-review-excellence`

## Detect Repo

Always derive owner and repo from git remote, never hardcode:

```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"
```

## Workflow

### 1. Select a PR

```
list_repo_pull_requests(owner, repo, state="open")
```

Show a numbered summary and ask the user which PR to review — unless a PR number was given upfront, in which case skip straight to step 2.

### 2. Read PR details and discussion

```
get_pull_request_by_index(owner, repo, index=N)
list_issue_comments(owner, repo, index=N)
```

Note the `head` and `base` branches from the response.

### 3. Get the diff

```bash
git fetch origin
git diff origin/{base}...origin/{head}
```

### 4. Perform the review

Apply the **code-review-excellence** skill to analyse the diff — work through context gathering, high-level review, and line-by-line review. Produce a structured review comment using the template from that skill.

### 5. Post the review comment

```
create_issue_comment(owner, repo, index=N, body="<review output from step 4>")
```

### 6. Label the outcome (optional)

```
add_issue_labels(owner, repo, index=N, labels="approved")
# or: "needs-changes", "needs-review"
```

### 7. Notify when done

Use the **ntfy-me** skill to send a notification to topic `code-review` with:
- Title: `PR Review Done – <PR title>`
- Tags: `mag,white_check_mark`
- Body: PR number, title, verdict, and repo

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs to select one |
| `get_pull_request_by_index` | Read PR metadata (branches, title, description) |
| `list_issue_comments` | Read existing discussion |
| `create_issue_comment` | Post the review comment |
| `add_issue_labels` | Label outcome (approved, needs-changes) |

## If MCP Tools Are Unavailable

> The `forgejo-mcp` MCP server is not active. Restart Claude Code — it is configured in `~/.claude.json` using the wrapper at `~/Projects/dotfiles/bin/forgejo-mcp-wrapper`.
