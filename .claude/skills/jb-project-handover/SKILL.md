---
name: project-handover
description: "Create a handover documentation package for a software project Jan owns and hands over to colleagues or a successor: explore the code with subagents, interview the owner, write short Markdown pages (runbooks, known issues, recurring duties, architecture, access, decisions) and build a static HTML site with the bundled converter (Bun, no dependencies). Also updates an existing package after the project changed: it re-checks the pages against the diff since the documented snapshot and edits them in place. Works for Ansible and Terraform repositories, Kubernetes deployment code and JavaScript or TypeScript services alike. Use when Jan says he has to hand over a project, 'Übergabe', 'Nachfolger', 'handover docs', 'document this project for my colleagues', wants his knowledge about a repository written down for others, names a repository to hand over, or wants existing handover docs brought up to date ('aktualisieren', 'update the handover docs', 'is the documentation still current')."
argument-hint: "<path to the project repository> | update [docs-dir] | build [docs-dir]"
---

# Project handover docs

Jan owns a project and hands it over to colleagues. They know the technology, so nothing here teaches basics. Most of them will not read the docs: Jan presents the package once, and later it is a reference when something breaks. So the pages are short, scannable and honest about what is not verified.

The result is Markdown in the project's `docs/handover/` folder (`docs/` itself is for other documentation) plus a static HTML site built from it. This skill's folder holds the converter (`scripts/build.ts`), the stylesheet and diagram player (`assets/`) and the detail lists (`references/`).

**Needs:** the `grill-me` skill for the interview (step 4), the `handoff` skill with its `in <dir>` argument for the interview state (steps 1, 4 and 8), and Bun for the converter. Both skills live in the dotfiles next to this one (`jb-grill-me`, `jb-handoff`); without them the interview and the resume do not work.

## Modes

The first word of the argument decides:

- **`build [docs-dir]`**: only rebuild the HTML site, nothing else (no exploring, no interview). Run `bun <skill dir>/scripts/build.ts [docs-dir]`. Without a folder the script uses `./docs/handover` if it holds an `index.md`, else the current folder. On success report the page count and open `<docs-dir>/_site/index.html` with `xdg-open` (on macOS `open`). On a broken link print each one and stop; the script exits 1. If there is no `index.md`, say so and stop (exit 2).
- **`update [docs-dir]`**: bring an existing package up to date, see "Updating a package" below.
- **anything else** (a repository path, or no argument): the full workflow below. If the docs folder already holds an `index.md` with a `status:` key, the package exists; say so and switch to update unless Jan wants it rebuilt from scratch.

## Rules that always apply

- **Draft until Jan says otherwise.** Every page carries the status line (the build adds it from `status:` in `index.md`). Never write Final. The start page has an "Open" line with everything unverified (`document-status.md`).
- **Facts need a source and a status.** Each claim in a table or runbook is `{verified}`, `{inferred}`, `{unverified}` or `{owner}` (stated by Jan). A fact from a subagent summary stays marked until you re-read the file yourself.
- **An absence is a question, not a finding.** Code reading shows what the repo does not do: no rate limit, no off-host backup, reads without a token, a value committed in a config file. Only the owner knows whether that is a gap, a decision or handled outside the repo. Until the interview answers it, such a point is an `{unverified}` question without a priority. The answer turns it into an issue or a row in the decisions or duties page.
- **Before writing prose for others, show the facts and wait for approval** (`fact-check-prose.md`). The checkpoint in step 3 is that table.
- **Dates and times come from `date`**, also in the status line (`dates.md`).
- **Handoffs stay in the repository.** Every `handoff` call carries `in docs/handover/_workspace`, never the vault: the interview state belongs next to the interview file, and a handoff in Obsidian would outlive the repository clone it describes.
- **Exploration runs in subagents** that return summaries with file paths, never dumps (`subagent-delegation.md`). Do not print secrets: write names of entries and variables only.
- **Read as if Jan wrote it** (`no-ai-tells.md`): no emojis, no "here is", no process narration, no hedging boilerplate. Names only as Jan gives them, no pronouns, no inferred surnames.
- **Language:** English unless Jan says otherwise. For German apply `german-text.md`.

## Steps

1. **Scope.** First check for an open handoff in `docs/handover/_workspace/` (the `handoff` skill, Resume mode with `in docs/handover/_workspace`). If one exists, load it, read the interview file it points to, and continue at the step the handoff names; usually that is step 4 with the questions still marked `open`. Otherwise ask only what is missing: repository path, how well the colleagues know the stack, language, where the docs live (default `docs/`). Check what documentation already exists and read the repo's own README and `CLAUDE.md`, but treat them as hints; they are often outdated.
2. **Explore** with subagents, following `references/explore-checklist.md`. Ask for summaries with file paths and line numbers, and for what they could not verify.
3. **Checkpoint.** Show Jan the proposed page set (below), the notable facts you found that are not yet written anywhere, and the interview questions. Wait for approval.
4. **Interview.** Invoke the `grill-me` skill. The first frontier is the whole list from `references/interview-questions.md` (core plus the tail for the stack), with what the code already answers filled in so Jan only confirms or corrects. Later rounds follow grill-me's own rule: only questions that an answer opened or that differ from the code. "Unknown" and "never" are valid answers; drop what Jan calls known. Skip grill-me's closing step (Forgejo issue, OpenSpec, spec file in `docs/`): the answers belong in `docs/handover/_workspace/interview-<date>.md`, nowhere else. Write that file after every round, not at the end, with a status per question (format in `references/interview-questions.md`); an interview often spans several sessions and a round that was answered but never written down is lost. When the interview stops, finished or not, invoke the `handoff` skill in Create mode with `in docs/handover/_workspace` so the next session can pick it up at the exact question: slug `handover-interview`, with the path of the interview file, the numbers of the open questions, the round reached and the next step. If an earlier handoff for this interview is still open, close it first with `handoff done in docs/handover/_workspace`; the handoff skill has no update mode and two open ones for one interview confuse the next session.
5. **Cross-check** every answer against the code. A difference is either a fix to make or a known issue, never silently resolved. Ask for the reasons behind decisions in the first round: they are the part git does not hold.
6. **Write** the pages in `docs/handover/*.md` using `references/markdown-conventions.md` and `references/page-templates.md`. Keep each page short, start it with an "In short" note, and put the walkthrough on the start page.
7. **Build and verify.** Run `bun <skill dir>/scripts/build.ts docs/handover` (it writes `docs/handover/_site/`, checks every link and anchor, and exits 1 on a broken one). Run `--selftest` after a Bun update. Look at the rendered pages. Re-read the facts the pages lean on, and re-check the snapshot (commit, uncommitted changes), because repos change while you work.
8. **Hand back.** List the open items, suggest ignoring `docs/handover/_site/` and keeping `docs/handover/_workspace/` out of the shared package, and draft commit messages. Close the interview handoff with `handoff done in docs/handover/_workspace`; the package is the result now, the handoff has nothing left to carry.

## The page set

Aim for at most eight pages. Merge or drop one that would be nearly empty, and adapt the names to the project (a JavaScript service has release and rollback runbooks instead of provisioning ones).

| Page | Answers |
|---|---|
| `index.md` | What is this, what is its status, who uses it, the 15-minute walkthrough |
| `runbooks.md` | How do I do the tasks I will actually do, and how do I know it worked |
| `issues.md` | What is weak today, how bad, and what would I do about it |
| `duties.md` | What runs by itself, what expires, who owns each, when may I touch it |
| `architecture.md` | What are the parts, how does a request or a deploy travel, what does it depend on |
| `access.md` | Which systems do I need, where do the credentials live (names only), who do I ask |
| `decisions.md` | What changed recently, why, and what is planned next |

Pages may carry the `toc: true` front matter key for an automatic table of contents. Diagrams use the `flow` block (see conventions).

## Updating a package

A handover package is only worth something while it matches the repo, so the pages are Markdown: Jan or an AI edits them in place instead of writing the package again. The anchor is the snapshot commit in the status box of `index.md`. What changed since that commit is the scope of the update, nothing else is re-explored.

1. **Diff since the snapshot.** Read the snapshot commit from `index.md`, then `git log --oneline <commit>..HEAD` and `git diff --stat <commit>..HEAD`. If the commit is unknown to the repo (rebased away), say so and take the date from the status line instead (`git log --since`). No changes and no open `{unverified}` facts: say so, refresh the status date and stop.
2. **Map changes to pages.** Each page leans on files (the `[!source]` lines and the paths in its tables). A changed file marks its page for review. Explore only the changed areas with subagents; give them the diff, not the whole checklist.
3. **Re-check what the pages claim.** For every marked page, re-read the facts against the current code: still true, changed, or gone. Also re-check the `{unverified}` facts, they may be verifiable now. Collect the differences as a short list: fact, page, old, new.
4. **Short interview.** One round, through `grill-me` as in step 4 of the full workflow: the reason behind each substantial change (git holds the what, not the why), new duties or expiries, issues that are fixed or new, anything decided outside the repo since the last update. Record it in `docs/handover/_workspace/interview-<date>.md` and write a handoff (`in docs/handover/_workspace`) when the round stops unfinished.
5. **Edit the pages in place.** Change the rows and steps that are wrong, add what is new, move a fixed issue to the "Done" table, add the decisions with their reasons to `decisions.md`. Untouched prose stays as it is, including its wording. Update the snapshot (commit, date) and the status date in `index.md` and set the "Open" line to what is open now.
6. **Build and hand back** as in steps 7 and 8. The status stays Draft until Jan says otherwise.

A page that no longer has a reason to exist (a service that was removed) is deleted, with a line in `decisions.md` saying when and why.

## What the interview is for

Code shows what exists. Only the owner knows the unwritten rules (take a snapshot first, always bump this number), what was never tested (usually restore), who owns which expiry, which job nobody remembers adding, and why a decision was made. Treat these as the main output, not the code reading.

See `references/lessons-learned.md` for what went wrong in the first run and how to avoid it.
