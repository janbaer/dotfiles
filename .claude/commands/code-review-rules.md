---
name: code-review-rules
description: Create or revise .code-review.md with the project-specific rules for the n8n PR reviewer
---

Create or revise `.code-review.md` in the root of the current repository. The n8n "Forgejo PR Review" workflow hands this file to the reviewer model as the project guidelines. The workflow prompt already defines how to review; this file only adds what is special about this project. Every rule in it can block a merge, so keep it short.

## What goes in

General project conventions that pass all three tests:

1. Jan would reject a PR over it.
2. A capable reviewer would not know it without project knowledge.
3. It can be checked in a diff.

Write each rule as one short imperative, general enough to cover the whole convention. No exceptions for single files, no lists of existing violations: the reviewer judges the diff, not the old code.

## What stays out

- anything about how to review: format, verdicts, severity, nits, follow-up rounds
- generic good practice any reviewer applies anyway
- an obligation `openspec/project.md` already states, which the workflow loads as well

The reviewer does not read `CLAUDE.md` or the README, so a convention stated only there may go in.

## New file

1. Delegate the reading to an `Explore` subagent and ask for a summary, not file contents: `CLAUDE.md`, `README.md`, `openspec/project.md`, manifests, lint config, CI, test layout. It reports the project conventions and what `openspec/project.md` already covers.
2. Ask Jan with `AskUserQuestion` what the repository does not show: what a PR must never do here, which past mistakes should not come back.
3. Show the draft.

## Existing file

Its rules are settled: keep them and their wording. Old code that breaks a rule is no reason to change it.

1. Read only the files changed since the last commit to the rules file:
   `git diff --name-only $(git log -1 --format=%H -- .code-review.md) HEAD`
2. Propose removing a rule only if a path, file or symbol it names no longer exists, or if it belongs under "What stays out".
3. Propose an addition only for a new convention in those changed files. Ask Jan only if they raise a question.
4. Otherwise say "nothing to change".

Write the file only after Jan approves. Do not stage or commit it.
