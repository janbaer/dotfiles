---
name: runbook
description: "Create, list, show, update, review and finalize runbooks for repeated tasks, stored as Markdown in docs/runbooks/. Use when Jan wants to write down a procedure he repeats (renewing a certificate, fixing a recurring problem, rolling out an update), asks for a runbook, 'write this down as a runbook', 'which runbooks do we have', or wants an existing runbook changed or checked. Trigger: '/runbook new|list|show|update|review|finalize'."
argument-hint: "new [title] | list | show <name> | update <name> | review [months] | finalize <name>"
---

# Runbook

A runbook is read by someone under time pressure who does not have the author's context. Everything below serves that reader: a step that cannot be checked, or a missing way back, is where they get stuck.

## Location and naming

- Directory: `docs/runbooks/` in the current repository. Create it on first use. If Jan names another directory, use that.
- Filename: `runbook-<slug>.md`. The slug comes from the title: lowercase, ASCII only (`ä` becomes `ae`, `ß` becomes `ss`), words joined by hyphens. Example: "Creating a new certificate" gives `runbook-creating-a-new-certificate.md`.
- Language: English. Write German only when Jan says so explicitly for this runbook. Then the whole runbook is German, headings included.
- Dates: run `date +%F`. Never take a date from context.

## Document format

A runbook is as long as the task needs and no longer. A task with one command gets about 30 lines, not a full document. Only the core is fixed: when to use, steps with expected results, and what to do if it does not work. Every other section is optional.

```markdown
---
title: Creating a new certificate
state: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
reviewed: YYYY-MM-DD
---

> **Status:** Draft — YYYY-MM-DD
> **Open:** <what could not be verified, or "—">

# Creating a new certificate

## When to use
The trigger: the alert, log line or situation that calls for this runbook. One to three lines.

## Steps
1. **Step title**
   ```bash
   command
   ```
   Expected: what you see when it worked.
   If not: what to do instead.

## If it does not work
Known failure modes and their fix, then who to escalate to. Two or three lines.
```

Optional sections, added only when the reader would act differently without them:
- **Prerequisites**: access, tools or system state that is not obvious. One line if possible.
- **Variables**: a table, only when the steps use values that change from run to run. Values the environment already provides do not belong here.
- **Verification**: only when the last step's expected result does not prove the whole task worked.
- **Rollback**: only when the task can be undone. If a step cannot be undone, put that as a warning in the step itself.
- **Related**: links to other runbooks.

Rules for the content:
- `state` is `draft` or `final`. The status header mirrors it. Always start as `draft`.
- Every step has a command or a concrete action and an expected result. A step without an expected result cannot be checked.
- No background. Why the problem happens does not help the person fixing it, unless it changes what they do.
- No speculation, improvement ideas or comments on the organisation. Unverified claims go into the "Open" line, ideas go into a ticket.
- Keep one `Expected` and one `If not` per step, and merge steps that only exist to look at something.
- `reviewed` is the last date someone confirmed the steps still work. A new runbook has `reviewed` equal to `created`, but the "Open" line says the steps were never run.

## Subcommands

No subcommand: ask which one is meant.

### new [title]

Gather the content with the `grill-me` skill. Invoke it with the Skill tool, with the goal "capture a runbook for a repeated task". The interview must cover: the trigger, the steps with expected results, known failure modes and the escalation path. Ask about prerequisites, verification and rollback only when the task is not trivial. Ask for real commands, not descriptions. If Jan already pasted a procedure or a shell history, extract the draft from it first and let the interview fill the gaps.

Before showing the draft, trim it: for every section and every sentence ask "would the reader do something different without this?" If not, cut it. Then show the draft and the target filename. Write the file only after Jan agrees. If the file exists, stop and suggest `update`.

Steps that were not run during the interview go into the "Open" line.

### list

Read the frontmatter of every `docs/runbooks/runbook-*.md`. Show a table: title, state, updated, reviewed, filename. Sort by title. Flag runbooks whose `reviewed` date is older than 6 months.

### show <name>

Find the runbook by filename or fuzzy title match. Print it. If several match, list them and ask.

### update <name>

Find the runbook, ask what changed, and edit only that. Set `updated` to today. If the state was `final`, set it back to `draft` and say so: the content changed, so the verification no longer holds. Do not touch `reviewed`.

### review [months]

List runbooks with `reviewed` older than the given number of months (default 6). For each, offer to walk through the steps with Jan. Set `reviewed` to today only when Jan confirms the steps still work.

### finalize <name>

Run only when Jan asks for it explicitly. Never set `final` on your own initiative: Jan carries the responsibility for the document. Before changing it, go through the checklist with Jan: each step was run or checked, every command and expected result is correct, rollback exists, no section is left as filler. Report failed checks. Set `state: final`, update the status header and `updated` only when all checks pass.

## Commits

Do not commit unless Jan asks. Follow his commit rules when he does.
