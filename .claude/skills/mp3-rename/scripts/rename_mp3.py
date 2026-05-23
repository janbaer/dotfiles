#!/usr/bin/env python3
# rename_mp3.py — Rename MP3 files in the current directory using ID3 tags.
# Convention: "Artist - Title.mp3"
# Strips non-ASCII, [ ] /, and collapses whitespace. Sets year if missing.
#
# Usage:
#   rename_mp3.py              Apply renames using ID3 tags.
#   rename_mp3.py --dry-run    Print JSON proposals; make no changes.
#   rename_mp3.py --tags       Reverse direction: derive ID3 tags from filenames
#                              (artist/title split on the first ' - ').
#   --dry-run and --tags combine freely.

import json
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


def clean(s):
  s = ''.join(c for c in s if 0x20 <= ord(c) <= 0x7E)
  s = s.replace(chr(0x60), "'")  # backtick → apostrophe
  s = s.translate(str.maketrans('', '', '[]/|'))
  s = re.sub(r' +', ' ', s).strip()
  return ' '.join(w[0].upper() + w[1:] if w else w for w in s.split(' '))


def query_tag(flag, path):
  return subprocess.run(
    ["id3", "--query", flag, path],
    capture_output=True, text=True
  ).stdout.strip()


def parse_filename(name):
  """Split 'Artist - Title.mp3' on the first ' - '. Returns (artist, title) or None."""
  stem = name[:-4] if name.lower().endswith(".mp3") else name
  if " - " not in stem:
    return None
  artist, title = stem.split(" - ", 1)
  return artist.strip(), title.strip()


def collect(tag_mode):
  current_year = str(datetime.now().year)
  entries = []

  for f in sorted(Path(".").glob("*.mp3")):
    name = f.name
    year = query_tag("%y", f)

    if tag_mode:
      parsed = parse_filename(name)
      if parsed is None:
        entries.append({"original_file": name, "skip": True,
                        "reason": "filename has no ' - ' separator"})
        continue
      new_artist, new_title = parsed
      if not new_artist or not new_title:
        entries.append({"original_file": name, "skip": True,
                        "reason": "empty artist or title parsed from filename"})
        continue
      entries.append({
        "original_file":   name,
        "original_artist": query_tag("%a", f),
        "original_title":  query_tag("%t", f),
        "new_artist":      new_artist,
        "new_title":       new_title,
        "set_year":        current_year if not year else None,
        "skip":            False,
      })
      continue

    artist = query_tag("%a", f)
    title  = query_tag("%t", f)

    if not artist or not title:
      entries.append({"original_file": name, "skip": True,
                      "reason": "missing artist or title tag"})
      continue

    clean_artist = clean(artist)
    clean_title  = clean(title)
    entries.append({
      "original_file":   name,
      "original_artist": artist,
      "original_title":  title,
      "new_artist":      clean_artist,
      "new_title":       clean_title,
      "new_filename":    f"{clean_artist} - {clean_title}.mp3",
      "set_year":        current_year if not year else None,
      "skip":            False,
    })

  return entries


def apply(entries, tag_mode):
  processed = 0
  skipped = 0

  for entry in entries:
    orig = entry["original_file"]

    if entry.get("skip"):
      print(f"SKIP: {orig}  ({entry.get('reason', '')})")
      skipped += 1
      continue

    if not Path(orig).is_file():
      print(f"SKIP (file not found): {orig}")
      skipped += 1
      continue

    new_artist = entry["new_artist"]
    new_title  = entry["new_title"]
    set_year   = entry.get("set_year")

    cmd = ["id3", "--artist", new_artist, "--title", new_title]
    if set_year:
      cmd += ["--year", str(set_year)]
    cmd.append(orig)
    subprocess.run(cmd, check=True, capture_output=True)

    year_note = f"  (year set to {set_year})" if set_year else ""

    if tag_mode:
      print(f"TAGGED: {orig}")
      print(f"     →  artist={new_artist!r}, title={new_title!r}{year_note}")
    else:
      new_name = entry["new_filename"]
      if orig != new_name:
        Path(orig).rename(new_name)
        print(f"RENAMED:  {orig}")
        print(f"       →  {new_name}{year_note}")
      else:
        print(f"OK (unchanged): {orig}{year_note}")

    processed += 1

  verb = "tagged" if tag_mode else "renamed"
  print(f"\nDone — {verb}: {processed}, skipped: {skipped}")


def main():
  args = sys.argv[1:]
  tag_mode = "--tags" in args
  dry_run = "--dry-run" in args
  extras = [a for a in args if a not in ("--tags", "--dry-run")]

  if extras:
    print("Usage: rename_mp3.py [--dry-run] [--tags]", file=sys.stderr)
    sys.exit(1)

  if shutil.which("id3") is None:
    print("ERROR: 'id3' is not installed. Run: nix shell nixpkgs#id3", file=sys.stderr)
    sys.exit(1)

  entries = collect(tag_mode)

  if dry_run:
    print(json.dumps(entries, indent=2))
    return

  apply(entries, tag_mode)


if __name__ == "__main__":
  main()
