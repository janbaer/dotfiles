# Stale context hygiene

Handoff notes and prior-session summaries are hints, not facts. Re-verify any concrete detail (names, dates, file paths, versions) against the live source before writing it into a document or commit.

## Why

A handoff note can be outdated. A prior-session summary can be wrong or incomplete. Both read as confident text, so a stale detail passes through unnoticed unless it is checked again.

## How to apply

- Before a concrete detail from a handoff note or a prior-session summary goes into a document or a commit, check it against the current file, the current repo state, or another live source.
- This is separate from `dates.md` (dates and times always come from `date`) and applies more broadly: names, file paths, versions, and other concrete facts.
