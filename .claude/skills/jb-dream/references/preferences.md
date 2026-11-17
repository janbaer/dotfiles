# Dream preferences

This file focuses the dream. Every analyzer and the organizer read it first. It grows from the user's reviews: each revert, skip with a reason, or comment on the morning page becomes one short lesson here. Keep it under 40 lines. When it grows past that, merge lessons that say the same thing.

These are examples to steer judgment, not a rulebook. Anthropic found that strict save rules made strong models worse at memory. Use judgment for anything these lessons do not cover.

## Purpose

Memory is a short map of lessons Claude learned the hard way, that are still true, and that no other file already says.

## Keep

- Corrections the user gave and approaches the user confirmed.
- Tool traps and the fix that worked.
- IDs, paths and links that took effort to find.

## Leave out

- Task progress and handoff notes.
- Anything a skill, README or CLAUDE.md already documents.

## Lessons from review

<!-- One line each: "YYYY-MM-DD: <lesson>. (<what the user did: reverted, skipped, commented>)" -->
2026-11-17: A file named like a secret is not a leak by itself. Check whether it holds values or only reads them (gopass, env) before calling it a security problem. (commented)
2026-11-17: Facts backed by git history or a direct correction from Jan are wanted, also skill bugs he reported. Hold back less for these. (saved)
