---
name: forgejo-pr-create
model: sonnet
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

### 2. Ensure branch is pushed

Check that the current branch exists on the remote and is up to date:

```bash
git status
# Look for "Your branch is ahead of 'origin/...' by N commits"
```

If the branch is ahead of its remote tracking branch (or has no remote tracking branch), push it first:

```bash
git push -u origin <current-branch>
```

Do **not** create the PR until the branch is fully pushed.

### 3. Confirm base branch

```bash
git remote show origin | grep "HEAD branch"
# typically "main"
```

### 4. Derive title and issue link

**If on a `feature/{N}-{slug}` branch:**

```
get_issue_by_index(owner, repo, index=N)
```

Use the issue title as the PR title and include `closes #N` in the body.

**If not on a feature branch or no issue number in branch name:**

Derive a title from the branch name or recent commits. Do not include `closes #N`.

### 5. Check for implementation deviations

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

### 6. Review the branch before it becomes public

Run `/simplify` first, then `/review-diff`. Act on what they report, and say
plainly which findings you are leaving alone and why. The reasoning and the
reason for that order live in `.claude/rules/pull-requests.md`.

Run whatever the project itself demands as well, its test suite, linters and
pre-commit hooks. If a hook regenerates a file, stage it before committing.

Only proceed once both have run. If a finding leads to further commits, push
them before creating the PR, so what the reviewer opens is the reviewed state.

### 7. Create the PR

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

### 8. Show the PR link

Output the URL of the newly created PR so the user can open it directly.

### 9. Wait for the automated review, then read it

Every new PR triggers a workflow that posts an AI review (user `ai`). It waits
60 s before starting, so the review usually lands after 1–3 minutes. Do not
make the user ask for it.

Start a background wait right after showing the link:

```bash
sleep 90   # Bash tool, run_in_background: true
```

The wait finishing produces a task notification. Then check for a review:

```
list_pull_reviews(owner, repo, index=<PR number>)
```

- **A review is there** → invoke the **forgejo-pr-feedback** skill for this PR
  in **loop mode**. It fixes what is clearly right, records deliberate
  declines in the PR description, pushes, and waits for the next review until
  the PR is approved. It asks Jan only about questionable points, bundled
  once per round.
- **Nothing yet** → wait again in the background, first 120 then 180 seconds,
  and check after each. After the third check say in one line that no review
  arrived and that `/forgejo-pr-feedback` reads it later, then stop. Do not
  keep waiting beyond that.

Skip the wait entirely when the user said they don't want it, or when the PR
was not created in this session.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `create_pull_request` | Open a new PR |
| `get_issue_by_index` | Read issue details for title, link, and deviation check |
| `update_issue` | Update issue body if implementation deviated from spec |
| `list_pull_reviews` | Check whether the automated review has arrived |
