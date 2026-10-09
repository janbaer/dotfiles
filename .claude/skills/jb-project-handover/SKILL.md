---
name: project-handover
description: "Create a handover documentation package for a software project Jan owns and hands over to colleagues: explore the code with subagents, interview the owner, write short Markdown pages (runbooks, known issues, recurring duties, architecture, access, decisions) and build a static HTML site with the bundled converter (Bun, no dependencies). Use when Jan says he has to hand over a project, 'Übergabe', 'handover docs', 'document this project for my colleagues', or names a repository to hand over."
argument-hint: "<path to the project repository> | build [docs-dir]"
---

# Project handover docs

Jan owns a project and hands it over to colleagues. They know the technology, so nothing here teaches basics. Most of them will not read the docs: Jan presents the package once, and later it is a reference when something breaks. So the pages are short, scannable and honest about what is not verified.

The result is Markdown in the project's `docs/` folder plus a static HTML site built from it. This skill's folder holds the converter (`scripts/build.ts`), the stylesheet and diagram player (`assets/`) and the detail lists (`references/`).

## Modes

The first word of the argument decides:

- **`build [docs-dir]`**: only rebuild the HTML site, nothing else (no exploring, no interview). Run `bun <skill dir>/scripts/build.ts [docs-dir]`. Without a folder the script uses `./docs` if it holds an `index.md`, else the current folder. On success report the page count and open `<docs-dir>/_site/index.html` with `open`. On a broken link print each one and stop; the script exits 1. If there is no `index.md`, say so and stop (exit 2).
- **anything else** (a repository path, or no argument): the full workflow below.

## Rules that always apply

- **Draft until Jan says otherwise.** Every page carries the status line (the build adds it from `status:` in `index.md`). Never write Final. The start page has an "Open" line with everything unverified (`document-status.md`).
- **Facts need a source and a status.** Each claim in a table or runbook is `{verified}`, `{inferred}`, `{unverified}` or `{owner}` (stated by Jan). A fact from a subagent summary stays marked until you re-read the file yourself.
- **Before writing prose for others, show the facts and wait for approval** (`fact-check-prose.md`). The checkpoint in step 3 is that table.
- **Dates and times come from `date`**, also in the status line (`dates.md`).
- **Exploration runs in subagents** that return summaries with file paths, never dumps (`subagent-delegation.md`). Do not print secrets: write names of entries and variables only.
- **Read as if Jan wrote it** (`no-ai-tells.md`): no emojis, no "here is", no process narration, no hedging boilerplate. Names only as Jan gives them, no pronouns, no inferred surnames.
- **Language:** English unless Jan says otherwise. For German apply `german-text.md`.
- **Work repos on gitlab.com: never create the commit.** Draft messages in chat; the project's `CLAUDE.md` may require a ticket number, then ask for it (`commits.md`).

## Steps

1. **Scope.** Ask only what is missing: repository path, how well the colleagues know the stack, language, where the docs live (default `docs/`). Check what documentation already exists and read the repo's own README and `CLAUDE.md`, but treat them as hints; they are often outdated.
2. **Explore** with subagents, following `references/explore-checklist.md`. Ask for summaries with file paths and line numbers, and for what they could not verify.
3. **Checkpoint.** Show Jan the proposed page set (below), the notable facts you found that are not yet written anywhere, and the interview questions. Wait for approval.
4. **Interview.** Invoke the `grill-me` skill with the seed questions from `references/interview-questions.md` (core plus the tail for the stack). Rounds, numbered, "unknown" is a valid answer, drop what Jan calls known. Save the raw answers to `docs/_workspace/interview-<date>.md`.
5. **Cross-check** every answer against the code. A difference is either a fix to make or a known issue, never silently resolved. Ask for the reasons behind decisions in the first round: they are the part git does not hold.
6. **Write** the pages in `docs/*.md` using `references/markdown-conventions.md` and `references/page-templates.md`. Keep each page short, start it with an "In short" note, and put the walkthrough on the start page.
7. **Build and verify.** Run `bun <skill dir>/scripts/build.ts docs` (it writes `docs/_site/`, checks every link and anchor, and exits 1 on a broken one). Run `--selftest` after a Bun update. Look at the rendered pages. Re-read the facts the pages lean on, and re-check the snapshot (commit, uncommitted changes), because repos change while you work.
8. **Hand back.** List the open items, suggest ignoring `docs/_site/` and keeping `docs/_workspace/` out of the shared package, and draft commit messages.

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

## What the interview is for

Code shows what exists. Only the owner knows the unwritten rules (take a snapshot first, always bump this number), what was never tested (usually restore), who owns which expiry, which job nobody remembers adding, and why a decision was made. Treat these as the main output, not the code reading.

See `references/lessons-learned.md` for what went wrong in the first run and how to avoid it.
