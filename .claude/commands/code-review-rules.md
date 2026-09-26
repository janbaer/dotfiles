---
name: code-review-rules
description: Create or revise .code-review.md with the project-specific rules for the n8n PR reviewer
---

Create or revise `.code-review.md` in the root of the current repository. The n8n workflow "Forgejo PR Review" reads this file from the base branch of every PR and hands it to the reviewer model (Forgejo user `ai`) as the project guidelines. A violation of any rule in it is a required change and blocks the merge, also in later review rounds. The reviewer and the PR author are both agents: nobody weighs a rule, every line is enforced.

## What belongs in the file

Only rules that pass all three tests:

1. **Would Jan reject a PR over this?** Preferences, style wishes and "nice to have" fail.
2. **Does it need project knowledge?** If a capable reviewer would flag it anyway (bugs, injection, leaked secrets, missing error handling), it fails.
3. **Can it be checked in a diff?** "Keep the code clean" fails. "Every new route in `src/routes/` has a test in `test/routes/`" passes.

There is no limit on the number of rules. Each one must pass on its own.

## What never belongs in the file

The workflow prompt already covers these concepts and overrides the project context on format. Leave them out, and remove them from an existing file:

- review structure, section names, output format
- verdict values and when to approve or request changes
- severity levels or ratings
- "no nits", "required changes only", "no suggestions"
- handling of follow-up rounds and previous findings
- "Deliberate decisions" and how pushback is weighed
- the round limit
- the language of the review
- generic check categories (security, correctness, performance, code quality) without a project-specific rule behind them

Anything already stated in `openspec/project.md` also stays out: the workflow loads that file next to `.code-review.md`.

This list mirrors `docs/forgejo-pr-review.md` in `jan/n8n`. Update it when the workflow changes.

## Workflow

### 1. Gather project knowledge

Delegate the reading to an `Explore` subagent and ask for a summary, not file contents. It covers:

- `CLAUDE.md`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`
- `openspec/project.md` and the specs under `openspec/specs/`, if present
- manifests and tooling: `package.json`, `flake.nix`, `go.mod`, `Cargo.toml`, `pyproject.toml`, lint and formatter configs, CI workflows under `.forgejo/`
- the directory layout, where tests live and how they are named
- `git log --oneline -50` for recurring fix or revert patterns

Ask it to report conventions that are enforced or stated as rules, fragile areas (migrations, generated files, public APIs, config formats), and what `openspec/project.md` already says.

### 2. Ask what the repository does not show

Use `AskUserQuestion` for the gaps: which areas break easily, what a PR must never do in this project, which past mistakes should not come back. Offer candidate rules from step 1 as options where that helps. Ask only what the analysis left open.

### 3. Draft

Filter every candidate through the three tests and the exclusion list. Write the rules in English as short imperatives, grouped by area when there are more than a handful. Name paths, commands or file patterns wherever a rule applies to part of the repo only. Add a reason only when the rule would look arbitrary without it.

```markdown
# Review rules for <project>

## <Area>

- <Rule>
```

### 4. New file or revision

**No `.code-review.md` yet:** show the full draft. Write the file only after Jan approves it.

**File exists:** compare it with the draft and propose a diff in three groups:

- remove: generic content, anything from the exclusion list, rules duplicated in `openspec/project.md`
- fix: rules that no longer match the code
- add: missing project-specific rules

Keep rules Jan wrote that still pass the tests, and keep their wording. Write the file only after Jan approves the diff. If nothing needs to change, say "nothing to change" and write nothing.

### 5. Finish

Do not stage or commit the file. Remind Jan that the reviewer reads it from the base branch, so it takes effect once it is merged.
