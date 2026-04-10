#!/usr/bin/env python3
# rename_mp3.py — Rename MP3 files in the current directory using ID3 tags.
# Convention: "Artist - Title.mp3"
# Strips non-ASCII, [ ] /, and collapses whitespace. Sets year if missing.
#
# Modes:
#   --json           Output rename proposals as JSON (for Claude to present as table)
#   --apply <file>   Execute renames from a JSON plan file produced by --json (possibly
#                    edited by the user via Claude's interactive review step)

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


def cmd_json():
  current_year = str(datetime.now().year)
  entries = []

  for f in sorted(Path(".").glob("*.mp3")):
    name   = f.name
    artist = query_tag("%a", f)
    title  = query_tag("%t", f)
    year   = query_tag("%y", f)

    if not artist or not title:
      entries.append({"original_file": name, "skip": True, "reason": "missing artist or title tag"})
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

  print(json.dumps(entries, indent=2))


def cmd_apply(plan_file):
  with open(plan_file) as f:
    entries = json.load(f)

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
    new_name   = entry["new_filename"]
    set_year   = entry.get("set_year")

    cmd = ["id3", "--artist", new_artist, "--title", new_title]
    if set_year:
      cmd += ["--year", str(set_year)]
    cmd.append(orig)
    subprocess.run(cmd, check=True, capture_output=True)

    year_note = f"  (year set to {set_year})" if set_year else ""
    if orig != new_name:
      Path(orig).rename(new_name)
      print(f"RENAMED:  {orig}")
      print(f"       →  {new_name}{year_note}")
    else:
      print(f"OK (unchanged): {orig}{year_note}")

    processed += 1

  print(f"\nDone — renamed: {processed}, skipped: {skipped}")


def main():
  if len(sys.argv) < 2 or sys.argv[1] not in ("--json", "--apply"):
    print("Usage: rename_mp3.py --json | --apply <plan.json>", file=sys.stderr)
    sys.exit(1)

  if shutil.which("id3") is None:
    print("ERROR: 'id3' is not installed. Run: nix shell nixpkgs#id3", file=sys.stderr)
    sys.exit(1)

  if sys.argv[1] == "--json":
    cmd_json()
  elif sys.argv[1] == "--apply":
    if len(sys.argv) < 3:
      print("ERROR: --apply requires a JSON plan file argument.", file=sys.stderr)
      sys.exit(1)
    plan_file = sys.argv[2]
    if not Path(plan_file).is_file():
      print("ERROR: --apply requires a valid JSON plan file.", file=sys.stderr)
      sys.exit(1)
    cmd_apply(plan_file)


if __name__ == "__main__":
  main()
