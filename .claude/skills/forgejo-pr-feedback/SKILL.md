---
name: forgejo-pr-feedback
description: Use when reading review comments on a Forgejo pull request to understand received feedback, assess whether each comment is correct, estimate the effort to address it, and post a follow-up comment summarising what was fixed and what was not. Trigger on phrases like "read PR comments", "check PR feedback", "what feedback did I get", "review comments on my PR", "what do the reviewers say", "assess PR review", "post review response", or "reply to review comments".
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**. Do NOT attempt workarounds such as REST API calls, curl, or any other method — the MCP server is the only supported interface.

# Forgejo PR Feedback Reader

Reads all review comments on a Forgejo PR and helps the PR author understand, evaluate, and prioritize the feedback they received.

## Workflow

### 1. Detect repo and select a PR

Derive owner and repo from git remote, never hardcode:

```bash
git remote get-url origin
# https://forgejo.home.janbaer.de/owner/repo.git → owner="owner", repo="repo"
```

List open PRs and ask the user which one to inspect — unless a PR number was given upfront:

```
list_repo_pull_requests(owner, repo, state="open")
```

### 2. Collect all feedback

Fetch every type of comment in parallel:

```
get_pull_request_by_index(owner, repo, index=N)      ← PR metadata + description
list_issue_comments(owner, repo, index=N)             ← general discussion comments
list_pull_reviews(owner, repo, index=N)               ← review summaries
```

For each review returned by `list_pull_reviews`, also fetch its inline comments:

```
list_pull_review_comments(owner, repo, index=N, id=<review_id>)
```

### 3. Get the diff for context

Retrieve the diff so inline comments can be evaluated against the actual code:

```
get_pull_request_diff(owner, repo, index=N)
```

### 4. Assess each comment

For every comment (general, review summary, and inline), produce an assessment with three parts:

**Validity** — Is this comment correct?
- `✅ Valid` — the concern is accurate and the suggestion would improve the code
- `⚠️ Partially valid` — the concern is real but the suggested fix may not be ideal
- `❌ Questionable` — the concern appears incorrect, subjective, or based on a misunderstanding — explain why

**Effort** — How much work would it take to address?
- `XS` — trivial (rename, typo, one-liner)
- `S` — small (< 30 min, isolated change)
- `M` — medium (1–3 hours, touches multiple places)
- `L` — large (> half a day, architectural or widespread change)

**Recommendation** — a one-sentence suggestion: address it, skip it, discuss it, or defer it.

### 5. Present the summary

Group the output into two sections:

**Review Summary**
A brief overview: how many comments were left, by whom, and the overall tone (approving, requesting changes, or mixed).

**Comment Breakdown**
Present each comment in this format:

```
[Reviewer] [file:line if inline]
> <quoted comment text (truncated to 2 lines if long)>
Validity: ✅ Valid | ⚠️ Partially valid | ❌ Questionable
Effort:   XS / S / M / L
→ <one-sentence recommendation>
```

Sort by: blocking issues first, then by effort (small first within each validity group).

End with a **prioritised action list** — a numbered list of the valid comments the user should address, ordered by impact vs effort.

### 6. Post a follow-up comment (after the user has worked on the feedback)

Once the user has addressed the items from the action list, offer to post responses that close the loop with the reviewers.

Before posting, ask the user for each item on the prioritised action list:
- Was it **fixed**? If yes, a brief note on what changed is enough.
- Was it **not fixed**? Ask why — common reasons: disagreed with the suggestion, deferred to a follow-up issue, too large in scope, intentional design decision.

**Replying to inline comments**

For each inline comment from a review, post an individual reply using `create_issue_comment`. Quote the original comment so the reviewer sees the context, then give a short response:

```markdown
> [reviewer] on `src/foo.ts` line 12: "This can be null — add a null check."

Fixed — added a null guard in the `getUser` function. ✅
```

or if not addressed:

```markdown
> [reviewer] on `src/bar.ts` line 34: "Extract this into a named constant."

Deferred — will address in the follow-up refactoring PR. ⏭️
```

Post replies for all inline comments, not just the ones that were fixed — reviewers appreciate knowing what happened to every point they raised.

**Overall summary comment**

After the inline replies, post one final summary comment using `create_issue_comment` with this structure:

```markdown
## Review Response

Thank you for the review! Here's a summary of how each point was addressed:

### ✅ Fixed

- **[short description of point]** — [what was changed / how it was resolved]
- …

### ⏭️ Not addressed

- **[short description of point]** — [reason: e.g. "Deferred — opened issue #N", "Intentional design: …", "Out of scope for this PR"]
- …
```

Only include sections that are relevant — omit "Not addressed" if everything was fixed, or "Fixed" if nothing was.

The goal of this comment is to respect the reviewer's time: it lets them see at a glance what changed and understand the reasoning behind anything that wasn't addressed, so they don't have to re-read the whole diff to figure out what happened.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs to select one |
| `get_pull_request_by_index` | Read PR metadata (title, description, branches) |
| `list_issue_comments` | Read general discussion comments |
| `list_pull_reviews` | Read review summaries and their status |
| `list_pull_review_comments` | Read inline comments for a specific review |
| `get_pull_request_diff` | Get the diff to evaluate inline comment accuracy |
| `create_issue_comment` | Post the follow-up review response comment |
