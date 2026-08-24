# Date and time

Never state a date, a weekday, or a time from context or from memory. Run
`date` first.

```bash
date                     # full timestamp including timezone
date +%A                 # weekday today
date -d 2026-08-24 +%A   # weekday of any date
date -d tomorrow +%F     # resolve a relative date
```

## Why

Two separate failure modes, both invisible from the inside:

- **The session context goes stale.** `currentDate` is stamped once, when the
  session starts. Sessions here regularly run past midnight, and from that
  point on "today" is simply wrong — nothing in the context changes to say so.
- **The clock is not in the context at all.** Only the date is. Any statement
  about the current time is a guess unless `date` produced it. This is how a
  "have fun running" landed at a time Jan was not running.
- **Weekdays are arithmetic, not knowledge.** Mapping a date to its weekday is
  a calculation. Guessing it is right most of the time, which is worse than
  being wrong every time: it passes unnoticed until it doesn't. A Vikunja task
  due 2026-08-24 was confirmed as "So, 24.08." when the 24th is a Monday.

## When it fires

Before any output that carries a concrete date, weekday, or time — whether it
goes into a chat reply, a file, or a tool call:

- due dates and reminders (Vikunja, CalDAV)
- diary and note filenames, and the dates inside them
- the `Status: Draft — YYYY-MM-DD` header from `document-status.md`
- anything phrased as "today", "tomorrow", "this morning", "tonight"

It does not fire for purely relative phrasing that names no date or time.

## Subagents

A subagent has its own context and the same stale stamp. When one produces a
date, it runs `date` itself — relaying its output unchecked reproduces the
error one level up.
