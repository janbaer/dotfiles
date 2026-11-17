# The ideal MEMORY.md

`MEMORY.md` is loaded into every chat of its project; topic files load only when Claude opens them. So `MEMORY.md` is a map, not a store. The organizer keeps it in this shape on every run.

## Shape

Keep the shape the existing file already has: its title, its line format and its headings. Claude Code's own default is a flat list:

```markdown
# Memory Index

- [Plans come first](plans-first.md) — show a short plan table and wait for approval before big changes
- [CRM export traps](crm-export-traps.md) — the API caps pages at 100 rows; dates come back in UTC
```

An index that already groups its lines under `##` headings keeps them. An empty folder gets the flat default.

## Rules

1. **150 lines at most.** Over 150, merge close memories into one topic file with one index line.
2. **One line per memory**, in the file's existing format. No blank lines inside a list or group. No duplicate lines.
3. **The hook states the fact.** It is a complete phrase under about 150 characters that a reader could act on without opening the file. Never cut off mid-sentence. "Routines can update artifacts if Artifact is loaded" beats "Routines CAN update artifacts if Artifact is".
4. **Behavior rules and corrections near the top**, so they survive if the file is ever cut.
5. **No rules that belong elsewhere.** A rule that applies to every project goes to the global rules folder. A team rule goes to the vault. The organizer lists these as `move_out` and keeps them until the user approves the move.
6. **No docs.** A memory that only repeats what a skill's SKILL.md, a README, a CLAUDE.md or a rules file says is removed from the index, with its file kept and linked from the topic file that needs it, or listed as `move_out` if a file should own it.

## Topic files

Each topic file:

```markdown
---
name: <slug, same as the file name without .md>
description: <one line, the same fact as the index hook>
metadata:
  type: user | feedback | project | reference
---

<The fact as a plain present-tense statement.>

**Why:** <what happened that taught it, with the date>
**How to apply:** <what to do next time>

History: <date> <old version>, replaced because <reason>
```

- New files follow the frontmatter shape the folder's existing files use; the block above is for an empty folder.
- Keep any extra frontmatter fields already there (for example `originSessionId`, `modified`).
- Date verified facts: "verified 2026-11-09".
- A replaced fact keeps one `History:` line. Do not silently delete it.
- Link related memories with `[[slug]]`.
- One topic per file. Two files on the same topic get merged into the better-named one. The other becomes a stub: `MOVED TO [[slug]]`.
