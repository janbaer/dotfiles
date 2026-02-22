---
name: gitlab-review-mr
description: Use when reviewing an open Merge Request on a GitLab repository - reading changes, leaving comments, or labelling the outcome.
---

# GitLab Merge Request Review

Uses the `gitlab-mcp` MCP server to review MRs on any GitLab project.

**REQUIRED SUB-SKILL:** Use `code-review-excellence` for the actual review process — feedback quality, severity labels, checklists, and templates. This skill handles only the GitLab-specific parts.

Installation with: `npx skills add https://github.com/wshobson/agents --skill code-review-excellence`

## Require Project Upfront

**Always ask for the project name before doing anything else** — unless it was passed as an argument.

The project name is the short repo name (e.g. `bu-pig`). Always prefix it with `c24-vorsorge/bu/` to form the full project path: `c24-vorsorge/bu/bu-pig`.

If an MR number was also passed as an argument, skip straight to step 2.

## Workflow

### 1. Select an MR

```
list_project_merge_requests(project_id="group/repo", state="opened")
```

Show a numbered summary and ask the user which MR to review — unless an MR number was given upfront.

### 2. Read MR details and discussion

```
get_merge_request(project_id="group/repo", mr_iid=N)
discussion_list(project_id="group/repo", mr_iid=N)
```

Note the `source_branch` and `target_branch` from the response.

### 3. Get the diff

```
list_merge_request_diffs(project_id="group/repo", mr_iid=N)
```

Or, if a local git remote is available:

```bash
git fetch origin
git diff origin/{target_branch}...origin/{source_branch}
```

### 4. Perform the review

Apply the **code-review-excellence** skill to analyse the diff — work through context gathering, high-level review, and line-by-line review. Produce a structured review comment using the template from that skill.

### 5. Show the review result

**Always** show the review result in a terminal first and ask the user if the review should be posted as a comment to the merge-request

### 5. Post the review comment

```
discussion_new(project_id="group/repo", mr_iid=N, body="<review output from step 4>")
```

### 6. Label the outcome (optional)

GitLab MRs use approvals and labels. Apply as appropriate:

```
edit_merge_request(project_id="group/repo", mr_iid=N, labels="approved")
# or: "needs-changes", "needs-review"
```

### 7. Notify when done

Use the **ntfy-me** skill to send a notification to topic `code-review` with:
- Title: `MR Review Done – <MR title>`
- Tags: `mag,white_check_mark`
- Body: MR number, title, verdict, and project

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_project_merge_requests` | List open MRs to select one |
| `get_merge_request` | Read MR metadata (branches, title, description) |
| `discussion_list` | Read existing discussion and review comments |
| `list_merge_request_diffs` | Get the file diffs for the MR |
| `discussion_new` | Post the review comment |
| `edit_merge_request` | Set labels on the outcome |

## If MCP Tools Are Unavailable

> The `gitlab-mcp` MCP server is not active. Restart Claude Code — check `~/.claude.json` for the server configuration.
