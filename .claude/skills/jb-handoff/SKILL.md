---
name: handoff
description: Create a handoff document to pass context to a fresh session, resume from an existing one, or close one out. Use when the user says "handoff", "create a handoff", "resume from handoff", "load handoff", "pick up where we left off", references a handoff file by name, runs "handoff list" / "handoff continue" to browse all existing handoffs, or runs "handoff done" to mark the current one finished.
argument-hint: "Next session focus, OR name of an existing handoff file to resume from (e.g. handoff-dotfiles-20260513-security-check.md), OR 'list' / 'continue' to pick from all existing handoffs, OR 'done' to close out the current one"
---

> **Vault access:** the Obsidian vault is reached only through the `obsidian` CLI, which talks to the running Obsidian app — it is NOT a plain folder on disk. Never `find`/`grep` the filesystem for notes. Default vault name: `Obsidian`. Handoffs live in the `Handoffs/` folder (capital H — do not create a lowercase variant).

## Status

Every handoff carries a `status` property in its frontmatter: `open` (still live work) or `done` (closed out). New handoffs are created `open`; `done` mode closes them.

Query status without reading the files — Obsidian's property search is one cheap call:

```
obsidian vault="Obsidian" search query="[status:open]" path="Handoffs"
obsidian vault="Obsidian" search query="[status:done]" path="Handoffs"
```

Read or write a single file's status with:

```
obsidian vault="Obsidian" property:read name="status" path="Handoffs/{filename}"
obsidian vault="Obsidian" property:set name="status" value="done" path="Handoffs/{filename}"
```

A handoff with **no** `status` property predates this convention — treat it as `open`.

## Detect the mode

**List mode** — the argument is exactly `list` or `continue` (case-insensitive), optionally followed by `all`. This is an explicit browse-and-pick command and takes priority over the heuristics below:
1. Get the **open** handoffs across every project in one call:
   ```
   obsidian vault="Obsidian" search query="[status:open]" path="Handoffs"
   ```
   Do NOT filter to the current directory — the point of `list`/`continue` is to choose from everything.
2. Decide what to offer:
   - **Open handoffs exist** → offer those.
   - **None open** → say "No open handoffs" plainly, then fall back to the newest **done** ones (`tag name="handoff"`) so the command is never a dead end. Label them as done in the selection box.
   - **`list all`** → skip the filter entirely: list every handoff via `obsidian vault="Obsidian" tag name="handoff"` and mark the done ones.
   - **No handoffs at all** → say so and offer to create one (Create mode).
3. Parse each filename (`handoff-{project}-{date}-{slug}.md`) into project, date, and slug, and sort by date (newest first).
4. Present the choices with the `AskUserQuestion` tool (a selection box) — do NOT make the user type a number:
   - **Exactly one** to offer → skip the selection box (it needs 2+ options) and load it directly, naming it first. One open handoff is still worth showing, not a reason to fall back to done ones.
   - Use the **4 newest** as the options. Each label is the slug; put the project and date in the option description, e.g. label `minuet-deepseek-source`, description `neovim · 2026-06-11`. Append `· done` to the description when showing done ones.
   - The tool caps at 4 options. If more than 4 exist, mention in the question text that older ones aren't listed; the user can pick the built-in "Other" choice and type a filename or number to reach them.
5. Load the chosen file exactly as Resume mode does (steps 3–5 below): read it, present the context, list any recommended skills and offer to invoke them, then summarise where things left off.

**Resume mode** — the argument looks like an existing handoff file (matches `handoff-*.md`, contains a path, or the user says "resume", "load", or "pick up"), OR no argument is given:
1. Determine the current project name: `basename $(pwd)`.
2. List all handoffs in one fast call — every handoff carries a `handoff` tag in its frontmatter:
   ```
   obsidian vault="Obsidian" tag name="handoff"
   ```
   Filter the returned paths to filenames starting with `handoff-{dirname}-`. (Do NOT scan the filesystem.)
   - If an explicit filename was given, load that file directly.
   - If exactly one file matches the current directory, load it directly.
   - If multiple files match, sort by date (newest first) and present them with the `AskUserQuestion` tool (a selection box) instead of a numbered list — label each option with its slug and put the date in the description, appending `· done` for any that are closed. Use the 4 newest as options; if more than 4 match, note that older ones are reachable via the built-in "Other" choice.
   - If no files match, say so and offer to create a new handoff instead.
3. Read the chosen file and present the context clearly: what was being worked on, current state, blockers, and what the next session should do first. If it is `status: done`, say so up front — it's resumable, but the work was closed out and the notes may be stale.
4. List any skills the doc recommends and offer to invoke them.
5. Say: "Handoff loaded. Here's where we left off:" followed by a concise summary.

**Done mode** — the argument is exactly `done` (case-insensitive), optionally followed by a filename, or the user says "mark the handoff done", "close the handoff", "that handoff is finished". Like `list`, this is an explicit command and takes priority over the Create-mode heuristic — a bare `done` is **never** a topic slug to create a handoff from:
1. Work out which handoff to close:
   - **A filename was given** → that one.
   - **A handoff was loaded earlier in this conversation** → that one. Don't re-discover it.
   - **Otherwise** → discover by project, exactly as Resume mode does: `obsidian vault="Obsidian" tag name="handoff"`, filter to filenames starting with `handoff-{basename $(pwd)}-`.
2. Narrow the matches:
   - Check status via `property:read` and prefer the **open** ones — a done handoff is normally not the target.
   - Exactly one open match → take it.
   - Multiple open matches → present them with `AskUserQuestion` (newest first, slug as label, date as description).
   - None open but done ones exist → say it's already closed and name it. Do not re-mark it.
   - No matches for this project → say so. Don't mark another project's handoff.
3. Mark it:
   ```
   obsidian vault="Obsidian" property:set name="status" value="done" path="Handoffs/{filename}"
   ```
4. Confirm with the exact filename. If the handoff's own "Next session should" list still has obviously unfinished items, mention them once — closing is the user's call, not yours, but a silent close on live work is worth one line of friction.

**Create mode** — the argument describes a future focus (not a file reference), or the user explicitly asks to create one:
1. Write a handoff document summarising the current conversation so a fresh agent can continue the work.
2. Determine the filename:
   - `dirname`: `basename $(pwd)`
   - `date`: today's date in `YYYYMMDD` format
   - `slug`: slugify the argument if one was passed (lowercase, spaces→hyphens, 3–5 words); otherwise infer a short topic slug from the conversation context
   - Full name: `handoff-{dirname}-{date}-{slug}.md`
3. Create it in the Obsidian `Handoffs/` folder (capital H): `obsidian vault="Obsidian" create path="Handoffs/{filename}" content="..."` (use `\n` for newlines, `\t` for tabs). The note MUST start with YAML frontmatter carrying a `handoff` tag and `status: open` — the tag is what Resume mode's search keys on, the status is what List and Done modes filter on:
   ```
   ---
   tags: [handoff]
   project: {dirname}
   branch: {git branch}
   date: {YYYY-MM-DD}
   status: open
   ---
   ```
   Add further topic tags after `handoff` if useful (e.g. `[handoff, npm, ci-cd]`).
4. Suggest the skills the next session should use, if any.
5. Do not duplicate content already in other artifacts (PRDs, plans, ADRs, issues, commits, diffs) — reference them by path or URL instead.
6. If the user passed a focus description, tailor the doc toward that goal.
7. End by telling the user the exact filename so they can pass it to the next session.
