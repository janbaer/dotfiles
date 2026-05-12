---
name: handoff
description: Create a handoff document to pass context to a fresh session, or resume from an existing one. Use when the user says "handoff", "create a handoff", "resume from handoff", "load handoff", "pick up where we left off", or references a handoff file by name.
argument-hint: "Next session focus, OR name of an existing handoff file to resume from (e.g. handoff-dotfiles-20260513-security-check.md)"
---

## Detect the mode

**Resume mode** — the argument looks like an existing handoff file (matches `handoff-*.md`, contains a path, or the user says "resume", "load", or "pick up"), OR no argument is given:
1. Determine the current project name: `basename $(pwd)`.
2. Scan the Obsidian `Handoffs/` folder for files matching `handoff-{dirname}-*.md`.
   - If an explicit filename was given, load that file directly.
   - If exactly one file matches the current directory, load it directly.
   - If multiple files match, show a numbered list sorted by date (newest first) and ask the user to pick one.
   - If no files match, say so and offer to create a new handoff instead.
3. Read the chosen file and present the context clearly: what was being worked on, current state, blockers, and what the next session should do first.
4. List any skills the doc recommends and offer to invoke them.
5. Say: "Handoff loaded. Here's where we left off:" followed by a concise summary.

**Create mode** — the argument describes a future focus (not a file reference), or the user explicitly asks to create one:
1. Write a handoff document summarising the current conversation so a fresh agent can continue the work.
2. Determine the filename:
   - `dirname`: `basename $(pwd)`
   - `date`: today's date in `YYYYMMDD` format
   - `slug`: slugify the argument if one was passed (lowercase, spaces→hyphens, 3–5 words); otherwise infer a short topic slug from the conversation context
   - Full name: `handoff-{dirname}-{date}-{slug}.md`
3. Save it in the Obsidian `Handoffs/` folder under that name.
4. Suggest the skills the next session should use, if any.
5. Do not duplicate content already in other artifacts (PRDs, plans, ADRs, issues, commits, diffs) — reference them by path or URL instead.
6. If the user passed a focus description, tailor the doc toward that goal.
7. End by telling the user the exact filename so they can pass it to the next session.
