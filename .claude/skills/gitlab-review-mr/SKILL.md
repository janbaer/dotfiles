---
name: gitlab-review-mr
description: Use when reviewing an open Merge Request on a GitLab repository - reading changes, analysing the diff, and labelling the outcome. Trigger on any phrase like "review MR", "review the merge request", "code review", "check the MR", "look at the PR", or "give feedback on the changes".
---

# GitLab Merge Request Review

Uses the `gitlab-mcp` MCP server to review MRs on any GitLab project.

**REQUIRED MCP SERVER:** `gitlab-mcp` — provides tools to interact with GitLab repositories, MRs, and discussions.
**OPTIONAL MCP-SERVER:** `jira-mcp` - Provides access to the original Jira ticket

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
Also note the `diff_refs` object — you will need `base_sha`, `head_sha`, and `start_sha` to post inline comments.

### 3. Optionally, read the original Jira issue from the title

Usually the title starts with `VERBU-12345` this is the issue number (of course the numbers are different)
With that you can get the ticket with the tool `jira-get-issue` from the `jira-mcp` server.
Read it for better understanding why the change was made.

### 4. Get the diff

```
list_merge_request_diffs(project_id="group/repo", mr_iid=N)
```

Or, if a local git remote is available:

```bash
git fetch origin
git diff origin/{target_branch}...origin/{source_branch}
```

### 5. Perform the review

Apply the **code-review-excellence** skill to analyse the diff — work through context gathering, high-level review, and line-by-line review. Produce a structured review comment using the template from that skill.

### 6. Show the review result and wait for approval

Show the full review result in the terminal. This includes inline comments and a summary — the summary is for local reference only and will never be posted to GitLab.

**STOP HERE. Do not post anything to GitLab yet.** Ask the user explicitly:
> "Should I go through the inline comments with you and ask which ones to post?"

Only proceed to step 7 if the user confirms. If they ask for changes to the review, update it and ask again before proceeding.

### 7. Post inline comments selectively (only after explicit user approval in step 6)

For each inline comment in the review, present it to the user and ask:
> "Post this comment to GitLab?"

Only post comments the user explicitly approves. Skip any they decline. The summary comment is **never posted** — it exists solely for the user's local reference.

Use the appropriate MCP tool to post each approved inline comment.

### 8. Done

The workflow is complete after posting the approved inline comments. Do not apply any labels — the user handles all labelling manually in GitLab.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_project_merge_requests` | List open MRs to select one |
| `get_merge_request` | Read MR metadata (branches, title, description) |
| `discussion_list` | Read existing discussion and review comments |
| `list_merge_request_diffs` | Get the file diffs for the MR |
| `create_merge_request_discussion` | Post an inline comment on a specific line |
| `jira-get-issue` | Read the original Jira ticket (optional, requires `jira-mcp`) |

## If MCP Tools Are Unavailable

The `gitlab-mcp` MCP server is not active, do not try to find any alternative solutions. Just inform the user and abort the workflow.

## Hints

- If you see in the package json, that also NPM packages were changed with that ticket, this is not a blocker, since everything will be merged later in a code-migration.
- Please do not praise the developers for doing a good job. They are not used to get such feedback and don't want to see it, they are just used to get critical feedback from the team-lead.
