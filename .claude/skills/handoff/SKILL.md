---
name: handoff
description: Create a handoff document to pass context to a fresh session, or resume from an existing one. Use when the user says "handoff", "create a handoff", "resume from handoff", "load handoff", "pick up where we left off", references a handoff file by name, or runs "handoff list" / "handoff continue" to browse all existing handoffs.
argument-hint: "Next session focus, OR name of an existing handoff file to resume from (e.g. handoff-dotfiles-20260513-security-check.md), OR 'list' / 'continue' to pick from all existing handoffs"
---

> **Vault access:** the Obsidian vault is reached only through the `obsidian` CLI, which talks to the running Obsidian app — it is NOT a plain folder on disk. Never `find`/`grep` the filesystem for notes. Default vault name: `Obsidian`. Handoffs live in the `Handoffs/` folder (capital H — do not create a lowercase variant).

## Detect the mode

**List mode** — the argument is exactly `list` or `continue` (case-insensitive). This is an explicit browse-and-pick command and takes priority over the heuristics below:
1. List **all** handoffs across every project in one call — every handoff carries a `handoff` tag in its frontmatter:
   ```
   obsidian vault="Obsidian" tag name="handoff"
   ```
   Do NOT filter to the current directory — the point of `list`/`continue` is to choose from everything.
2. Parse each filename (`handoff-{project}-{date}-{slug}.md`) into project, date, and slug, and sort by date (newest first). If no handoffs exist, say so and offer to create one (Create mode).
3. Present the choices with the `AskUserQuestion` tool (a selection box) — do NOT make the user type a number:
   - Use the **4 newest** handoffs as the options. Each label is the slug; put the project and date in the option description, e.g. label `minuet-deepseek-source`, description `neovim · 2026-06-11`.
   - The tool caps at 4 options. If more than 4 handoffs exist, mention in the question text that older ones aren't listed; the user can pick the built-in "Other" choice and type a filename or number to reach them.
4. Load the chosen file exactly as Resume mode does (steps 3–5 below): read it, present the context, list any recommended skills and offer to invoke them, then summarise where things left off.

**Resume mode** — the argument looks like an existing handoff file (matches `handoff-*.md`, contains a path, or the user says "resume", "load", or "pick up"), OR no argument is given:
1. Determine the current project name: `basename $(pwd)`.
2. List all handoffs in one fast call — every handoff carries a `handoff` tag in its frontmatter:
   ```
   obsidian vault="Obsidian" tag name="handoff"
   ```
   Filter the returned paths to filenames starting with `handoff-{dirname}-`. (Do NOT scan the filesystem.)
   - If an explicit filename was given, load that file directly.
   - If exactly one file matches the current directory, load it directly.
   - If multiple files match, sort by date (newest first) and present them with the `AskUserQuestion` tool (a selection box) instead of a numbered list — label each option with its slug and put the date in the description. Use the 4 newest as options; if more than 4 match, note that older ones are reachable via the built-in "Other" choice.
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
3. Create it in the Obsidian `Handoffs/` folder (capital H): `obsidian vault="Obsidian" create path="Handoffs/{filename}" content="..."` (use `\n` for newlines, `\t` for tabs). The note MUST start with YAML frontmatter carrying a `handoff` tag — this is what Resume mode's tag search keys on:
   ```
   ---
   tags: [handoff]
   project: {dirname}
   branch: {git branch}
   date: {YYYY-MM-DD}
   ---
   ```
   Add further topic tags after `handoff` if useful (e.g. `[handoff, npm, ci-cd]`).
4. Suggest the skills the next session should use, if any.
5. Do not duplicate content already in other artifacts (PRDs, plans, ADRs, issues, commits, diffs) — reference them by path or URL instead.
6. If the user passed a focus description, tailor the doc toward that goal.
7. End by telling the user the exact filename so they can pass it to the next session.
