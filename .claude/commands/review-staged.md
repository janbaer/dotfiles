---
name: review-staged
description: Review staged changes before commit
---

Delegate the work to the `review-diff-executor` subagent in staged mode and pass its output through verbatim. The agent reviews only the staged changes — exactly what will land in the next commit.

## Workflow

Invoke the `review-diff-executor` subagent via the `Agent` tool:

- `subagent_type`: `review-diff-executor`
- `description`: short, e.g. "Review staged changes"
- `prompt`: `mode: staged. Review the staged changes (what will land in the next commit). Return the review per ~/.claude/rules/review.md.`

Pass the result through to the user without further editing.

**Error case:** if the agent reports that there are no staged changes, just relay that — no workaround.
