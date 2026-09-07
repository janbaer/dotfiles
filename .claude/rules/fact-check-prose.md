# Fact-check pass before prose

Before you write prose meant for someone else to read — a report, an article, write-up notes, anything covered by `document-status.md` — list every concrete fact you plan to include: names, dates, places, activities, numbers. Show it as a table with a source column (e.g. "user statement", "code", "ticket", "web", "inferred"). Wait for approval. Then write, using only facts with a real source — drop or flag any fact marked "inferred".

## Why

Wrong names, wrong weekdays, invented goals, misattributed advice — these slip into confident prose as easily as checked facts do. A source table turns a silent guess into something Jan can scan and catch before it reaches the text, instead of after.

## Scope

- Applies to prose written for someone else: reports, articles, write-ups, notes.
- Does not apply to chat replies, code, or commit messages — same boundary as `document-status.md`.
- Does not apply where a skill already runs its own verification and confirmation step before writing — e.g. `diary-daily-entry` reads calendar/Vikunja directly and shows the full draft for approval before it touches disk.
- Complements `document-status.md`: that rule's "Source" and "Verified" checks gate Draft to Final; this rule is the step that produces the sourced facts in the first place.
