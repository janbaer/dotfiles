---
name: forgejo-pr-feedback
model: sonnet
description: Use when reading review comments on a Forgejo pull request to understand received feedback, assess whether each comment is correct, estimate the effort to address it, and post a follow-up comment summarising what was fixed and what was not. Also runs the fix-push-rereview loop with the automated `ai` reviewer until the PR is approved. Trigger on phrases like "read PR comments", "check PR feedback", "what feedback did I get", "review comments on my PR", "what do the reviewers say", "assess PR review", "post review response", "reply to review comments", "work through the review", or "iterate until approved".
disable-model-invocation: false
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**. Do NOT attempt workarounds such as REST API calls, curl, or any other method — the MCP server is the only supported interface.

# Forgejo PR Feedback Reader

Reads all review comments on a Forgejo PR and helps the PR author understand, evaluate, and prioritize the feedback they received.

Two modes:

- **Assessment** (default) — steps 1–5 once, then step 6 when the user has worked on the feedback.
- **Loop** — used when `forgejo-pr-create` hands over a PR it just opened, or when the user asks to work through the review until it is approved. Steps 1–4 for the latest review, then the **Loop mode** section below, round after round.

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

In loop mode, skip this presentation and continue with **Loop mode**.

## Loop mode

The n8n review workflow posts a review as user `ai` when a PR opens and again after every push, 60 s after the push settles. It reads the PR description and its own latest review with the inline comments, not PR comments. It counts its rounds since its last `APPROVED` and sends Jan an ntfy instead of reviewing once that reaches 5.

Run the rounds below until a stop condition is hit. One round ends in at most one push, because every push costs a review.

### L1. Take the latest `ai` review

The `ai` review with the highest `id` is this round's review; remember its `id`. Assess it and its inline comments as in step 4, together with any human comments added since the previous round. Earlier `ai` reviews are settled: the latest one already reports on them in its "Previous Findings" section.

Also count the `ai` reviews with an `id` above the latest `ai` `APPROVED` (all of them if there is none). At 5, stop and tell Jan the round limit is reached: the workflow will not review again, so another push would only wait for nothing.

### L2. Stop on approval

If its state is `APPROVED`, send an ntfy (`--title "PR approved"`, body `#N: <PR title>`), say in one line that the PR is ready to merge, and stop. Remaining nits in an approving review are not worth another round.

### L3. Sort every finding

| Bucket | What goes in | Action |
|---|---|---|
| **Fix** | (`✅ Valid` or `⚠️ Partially valid` with an obvious better fix) with effort XS or S | Fix it without asking |
| **Decline** | Contradicts a decision already recorded in the issue or in the PR description's "Deliberate decisions", and the record already says why | Add or sharpen the entry in "Deliberate decisions" without asking |
| **Ask** | `❌ Questionable` where declining is not already backed by a recorded decision; effort M or L; anything that would overturn a decision from the issue; any point where you are unsure which bucket applies | Ask Jan |

Jan wants to be asked only about the **Ask** bucket. Do not ask about fixes that are clearly right or about declines an existing decision already covers.

### L4. Ask once, bundled

If the **Ask** bucket is not empty, collect every item from this round into one question: finding, your assessment, what you would do. Use AskUserQuestion when the options are clear, one question per item, up to four; list any further items in the text. Send an ntfy (`--title "PR input needed"`, body `#N: <count> points to decide`) and wait for the answers before pushing anything. Items Jan decides to leave go into "Deliberate decisions" with his reason.

### L5. Fix, record, push once

1. Make the fixes. Run the project's own tests and linters. Do not rerun `/simplify` and `/review-diff`; they ran before the PR was created.
2. Update the PR description with `update_pull_request`: keep the existing text, and add or update a `## Deliberate decisions` section with one bullet per declined point — the decision in bold, then the reason in a sentence or two. Do this **before** the push, since the reviewer reads the description when it runs. The description is the only place where the reviewer will see a decline; a reply comment does not reach it.
3. Commit following the commit rules, then push once.

If nothing was fixed and only the description changed, do not push an empty commit. Editing the description does not trigger a review, so the loop would stall. Stop and tell Jan the remaining points are all recorded as deliberate.

### L6. Wait for the next review

Wait in the background (`sleep 90`, Bash with `run_in_background: true`), then look for an `ai` review with an `id` above the one from L1. If there is none, wait 120 s, then 180 s, and check again after each wait. After the third miss, say in one line that no review arrived and stop. A likely cause is that the round limit has been reached and the ntfy went to Jan instead.

When a new review is there, go back to L1.

### Stop conditions

- The review is `APPROVED` (L2).
- The round ended with nothing to push (L5).
- No new review arrived after three waits (L6).
- Five `ai` reviews since the last approval (L1).
- Jan says stop.

Loop mode posts no reply comments. Step 6 is for human reviewers and assessment mode.

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
| `update_pull_request` | Record declined points under "Deliberate decisions" (loop mode) |
