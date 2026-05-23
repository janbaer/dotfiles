---
name: mp3-rename
model: haiku
description: >
  Renames all MP3 files in the current directory using their ID3 tags, following
  the convention "Artist - Title.mp3". Strips non-ASCII characters, [ ] /, collapses
  whitespace, and sets the year tag to the current year if missing. Shows a numbered
  preview before any change is applied.
  With the --tags argument the direction is reversed: the ID3 tags are derived from
  the filename instead (artist/title split on the first " - ").
  Use this skill whenever the user wants to rename, clean up, or normalize MP3 filenames
  based on their tags — triggered by phrases like "rename my mp3 files", "clean up the
  filenames", "normalize mp3 names", "rename using id3 tags", or when the working
  directory contains MP3 files and the user wants consistent naming. Also use it when
  the user wants to set the tags from the filenames ("--tags", "fix the tags from the
  filename", "tag from filename").
---

# MP3 Rename

Two directions, depending on the invocation argument:

- **Default** — rename every `.mp3` in the current directory to `Artist - Title.mp3`
  using its ID3 tags.
- **`--tags`** — leave the filenames alone and instead write the ID3 tags *from* the
  filename. Artist is the part before the first `" - "`, title the part after it.

Both directions preview the plan first, then apply on confirmation.

Check the invocation arguments for `--tags` to pick the direction.

---

## Step 1 — Check dependency

```bash
command -v id3
```

If not found, tell the user to run `nix shell nixpkgs#id3` and stop.

---

## Step 2 — Preview

Run the bundled script with `--dry-run` (and `--tags` if applicable):

```bash
# default direction
/home/jan/.claude/skills/mp3-rename/scripts/rename_mp3.py --dry-run

# --tags direction
/home/jan/.claude/skills/mp3-rename/scripts/rename_mp3.py --dry-run --tags
```

This outputs a JSON array. Each entry has:
- `original_file`, `original_artist`, `original_title`
- `new_artist`, `new_title`
- `new_filename` (default direction only — absent in `--tags` mode)
- `set_year` (string like "2026", or null if year tag already set)
- `skip` (true if the entry can't be processed — see `reason`)

Skip reasons:
- Default: file is missing its artist or title tag.
- `--tags`: filename has no `" - "` separator, or empty artist/title after splitting.

---

## Step 3 — Present the numbered review table

Show ALL entries (including skipped ones) as a markdown table with a `#` column.

**Default direction:**

| # | Original Artist | Original Title | New Artist | New Title | New Filename |
|---|---|---|---|---|---|
| 1 | … | … | … | … | … |

**`--tags` direction** — same shape, showing how the tags will look afterwards
(the filename is the source and stays unchanged):

| # | Filename | Original Artist | Original Title | New Artist | New Title |
|---|---|---|---|---|---|
| 1 | … | … | … | … | … |

For skipped files, put `—` in the New columns and note the reason. Truncate very
long titles with `…` if needed for readability.

**No-op guard:** before asking the user, check whether any entry would actually
change something. An entry is a real change if any of the following is true:
- `original_artist != new_artist`
- `original_title != new_title`
- `set_year` is not null
- (default direction only) `original_file != new_filename`

If every non-skipped entry is a no-op, tell the user "Nothing to do — all files
already match." and stop. Do **not** ask "Apply these changes?" in that case.

Otherwise ask:

> "Apply these changes?"

---

## Step 4 — Apply

On confirmation, run the script again *without* `--dry-run` (keep `--tags` if applicable):

```bash
# default direction
/home/jan/.claude/skills/mp3-rename/scripts/rename_mp3.py

# --tags direction
/home/jan/.claude/skills/mp3-rename/scripts/rename_mp3.py --tags
```

The script re-scans the directory and applies the same logic that produced the
preview. Relay the output: how many files were renamed/tagged, how many skipped,
and which had their year tag set for the first time.

---

## Notes

- The script re-scans between preview and apply. Don't modify the files in between.
- Cleaning rules (default direction only): keep printable ASCII (0x20–0x7E), strip
  `[`, `]`, `/`, `|`, collapse multiple spaces, trim whitespace. The `--tags` direction
  takes filename values literally (just trimmed).
- Year is only set when the tag was absent or empty — existing years are never
  overwritten. This applies to both directions.
- Default direction: if a file's proposed new name equals the current name, the
  rename is skipped but the tags are still updated (cleaned values + year if needed).
