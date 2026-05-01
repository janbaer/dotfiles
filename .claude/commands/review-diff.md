---
name: review-diff
description: Review the diff between the current feature and the master or main branch
---

Delegate the work to the `review-diff-executor` subagent and pass its output through verbatim. The agent owns the workflow (fetch the diff, run lint/test, review against `~/.claude/rules/review.md`) — this command file is intentionally thin so that diff and lint output do not land in the main context.

## Workflow

Invoke the `review-diff-executor` subagent via the `Agent` tool:

- `subagent_type`: `review-diff-executor`
- `description`: short, e.g. "Review feature branch against main"
- `prompt`: `Review the current feature branch against main (or master if main does not exist). Return the review per ~/.claude/rules/review.md.`

Pass the result through to the user without further editing.

**Error case:** if the agent reports that there are no commits ahead of the base branch, just relay that — no workaround.
