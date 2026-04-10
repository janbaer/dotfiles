---
name: forgejo-pr-review
description: Use when reviewing an open Pull Request on a Forgejo repository - reading changes, leaving comments, or labelling the outcome. Trigger on phrases like "review PR", "review a pull request", "check the PR", "review the changes", or "give feedback on the PR".
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**. Do NOT attempt workarounds such as REST API calls, curl, or any other method — the MCP server is the only supported interface.
- **REQUIRED AGENT:** `code-reviewer` — performs the actual diff analysis. Must be available in `.claude/agents/`. If not found, inform the user and abort — they can add the agent by creating `.claude/agents/code-reviewer.md` in their dotfiles.

# Forgejo Pull Request Review

Uses the `forgejo-mcp` MCP server, git, and the `code-reviewer` agent to review PRs on any Forgejo project.

## Workflow

### 1. Detect repo and select a PR

Derive owner and repo from git remote, never hardcode:

```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"
```

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

Delegate the review to the **code-reviewer** agent. Pass the diff from step 3 as input. The agent returns a JSON object with `verdict`, `summary`, and `comments`.

Parse the agent's JSON response to extract:
1. **verdict** — `approve`, `request_changes`, or `comment`
2. **summary** — overall review text
3. **comments** — array of inline comments with `path`, `position`, `body`, and `severity`
   - `critical`/`warning` comments are always posted; `note` comments are shown in the terminal but omitted from the Forgejo review unless the user confirms

### 5. Show the review result

**Always** show both the summary and the list of inline comments in the terminal first. Ask the user if the review should be posted.

### 6. Post the review

Map the agent's verdict to a Forgejo event:
- `approve` → `APPROVED`
- `request_changes` → `REQUEST_CHANGES`
- `comment` → `COMMENT`

Use `create_pull_review` to post the summary and all inline comments in a single review:

```
create_pull_review(
  owner, repo, index=N,
  body="<summary from agent>",
  event="<mapped verdict>",
  comments=[...]
)
```

- `position` is the line number within the diff hunk (not the file line number)
- Only include inline comments where there is a specific, actionable suggestion
- If `create_pull_review` is unavailable, fall back to `create_issue_comment` for the summary only

### 7. Label the outcome (optional)

```
add_issue_labels(owner, repo, index=N, labels="approved")
# or: "needs-changes", "needs-review"
```

### 8. Notify when done

```bash
~/bin/ntfy --title "PR Review Done – <PR title>" --tags "mag,white_check_mark" --topic "code-review" \
  "PR #<N> · <verdict> · <repo>"
```

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs to select one |
| `get_pull_request_by_index` | Read PR metadata (branches, title, description) |
| `list_issue_comments` | Read existing discussion |
| `create_pull_review` | Post summary + inline comments as a single PR review |
| `submit_pull_review` | Submit a pending review if created in draft state |
| `create_issue_comment` | Fallback: post summary-only comment if review tool unavailable |
| `add_issue_labels` | Label outcome (approved, needs-changes) |

## Notes

- Never flag variables, imports, or functions as "unused" based solely on what's visible in the diff. Diffs show limited context and will miss usages outside the visible window. Before making any "unused/dead code" claim, fetch the full file from the head branch (e.g. `git show origin/{head}:path/to/file`) and verify there are no other usages.
- Please do not praise the developers for doing a good job — stick to critical, actionable feedback.
