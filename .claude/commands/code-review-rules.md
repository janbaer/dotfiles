---
name: code-review-rules
description: Create or revise docs/project.md and .code-review.md, the project context and rules for the n8n PR reviewer
---

Create or revise two files in the current repository. The n8n "Forgejo PR Review" workflow hands both to the reviewer model; the workflow prompt already defines how to review.

- `docs/project.md` tells the reviewer what the project is.
- `.code-review.md` adds the rules that are special about this project. Every rule in it can block a merge, so keep it short.

## docs/project.md

Describe the project: purpose, tech stack, architecture and layer rules, domain context, important constraints, external dependencies. Conventions may stay in it.

Whenever `docs/project.md` is written, check `CLAUDE.md`: it references `docs/project.md`, and it does not repeat what `docs/project.md` already says. Propose the reference and the removal of duplicates as part of the same change.

## .code-review.md

General project conventions that pass all three tests:

1. Jan would reject a PR over it.
2. A capable reviewer would not know it without project knowledge.
3. It can be checked in a diff.

Write each rule as one short imperative, general enough to cover the whole convention. No exceptions for single files, no lists of existing violations: the reviewer judges the diff, not the old code.

Always include: "A PR that changes the tech stack, architecture, domain entities or constraints updates `docs/project.md`."

Leave out:

- anything about how to review: format, verdicts, severity, nits, follow-up rounds
- generic good practice any reviewer applies anyway
- an obligation `docs/project.md` already states

The reviewer does not read `CLAUDE.md` or the README, so a convention stated only there may go in.

## New file

1. Delegate the reading to an `Explore` subagent and ask for a summary, not file contents: `CLAUDE.md`, `README.md`, `docs/project.md`, manifests, lint config, CI, test layout, directory structure. It reports what the project is, its conventions, and what the existing project file already covers.
2. Ask Jan with `AskUserQuestion` what the repository does not show: the purpose if unclear, what a PR must never do here, which past mistakes should not come back.
3. Show the draft.

## Existing file

Its content is settled: keep it and its wording. Old code that breaks a rule is no reason to change it.

1. Read only the files changed since the last commit to that file:
   `git diff --name-only $(git log -1 --format=%H -- <file>) HEAD`
2. Propose removing something only if a path, file or symbol it names no longer exists, or if it belongs under "Leave out".
3. Propose an addition only for something new in those changed files. Ask Jan only if they raise a question.
4. Otherwise say "nothing to change".

Write a file only after Jan approves. Do not stage or commit it.
