---
name: mp3-rename
description: >
  Renames all MP3 files in the current directory using their ID3 tags, following
  the convention "Artist - Title.mp3". Strips non-ASCII characters, [ ] /, collapses
  whitespace, and sets the year tag to the current year if missing. Shows a numbered
  review table before renaming so the user can correct individual proposals.
  Use this skill whenever the user wants to rename, clean up, or normalize MP3 filenames
  based on their tags — triggered by phrases like "rename my mp3 files", "clean up the
  filenames", "normalize mp3 names", "rename using id3 tags", or when the working
  directory contains MP3 files and the user wants consistent naming.
---

# MP3 Rename

Rename every `.mp3` in the current directory to `Artist - Title.mp3` using ID3 tags,
with an interactive review step before anything is touched.

---

## Step 1 — Check dependency

```bash
command -v id3
```

If not found, tell the user to run `nix shell nixpkgs#id3` and stop.

---

## Step 2 — Collect proposals

Run the bundled script in JSON mode from the user's current working directory:

```bash
/home/jan/.claude/skills/mp3-rename/scripts/rename_mp3.py --json
```

This outputs a JSON array. Each entry has:
- `original_file`, `original_artist`, `original_title`
- `new_artist`, `new_title`, `new_filename`
- `set_year` (string like "2026", or null if year tag already set)
- `skip` (true if the file is missing artist/title tags)

---

## Step 3 — Present the numbered review table

Show ALL entries (including skipped ones) as a markdown table with a `#` column:

| # | Original Artist | Original Title | New Artist | New Title | New Filename |
|---|---|---|---|---|---|
| 1 | … | … | … | … | … |

- For skipped files, put `—` in the New columns and note the reason.
- Keep the table concise — truncate very long titles with `…` if needed for readability,
  but use the full values when writing the plan file.

Then ask:

> "Enter the numbers you'd like to edit (comma-separated), or say 'go' / 'apply all' to rename everything."

---

## Step 4 — Handle corrections

For each number the user provides:

1. Show the current proposed filename for that entry.
2. Ask: "New filename?" (they type the full `Artist - Title.mp3` string).
3. Parse `Artist - Title` out of their input and update `new_artist`, `new_title`,
   and `new_filename` in the entry accordingly.
4. After all corrections, briefly confirm the updated proposals.

If the user just presses Enter (no numbers), skip this step entirely.

---

## Step 5 — Write the plan and apply

Write the (possibly corrected) JSON array to a temp file, then run:

```bash
/home/jan/.claude/skills/mp3-rename/scripts/rename_mp3.py --apply /tmp/mp3-rename-plan.json
```

Relay the script output to the user: how many renamed, how many skipped, and which
files had their year tag set for the first time.

---

## Notes

- The script's cleaning rules: keep printable ASCII (0x20–0x7E), strip `[`, `]`, `/`, `|`,
  collapse multiple spaces, trim leading/trailing whitespace.
- Year is only set when the tag was absent or empty — existing years are never overwritten.
- If a file's proposed new name is the same as the current name, the script skips the
  rename but still updates the tags (cleaned values + year if needed).
