#!/usr/bin/env bash
set -euo pipefail

claude_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
page="${1:-$HOME/Documents/Obsidian/AI/claude-code-uebersicht.md}"

disk=$(
  {
    for f in "$claude_dir"/skills/jb-*/SKILL.md; do basename "$(dirname "$f")"; done
    for d in commands agents rules; do
      for f in "$claude_dir/$d"/*.md; do basename "$f" .md; done
    done
  } | sort -u
)

listed=$(
  awk -F'|' '/^\| / { gsub(/`/, "", $2); sub(/^ *\/?/, "", $2); split($2, a, /[ \\<\[]/); print a[1] }' "$page" \
    | grep -E '^[a-z0-9]+(-[a-z0-9]+)*$' | sort -u
)

missing=$(comm -23 <(echo "$disk") <(echo "$listed"))
stale=$(comm -13 <(echo "$disk") <(echo "$listed"))

if [ -z "$missing$stale" ]; then
  echo "Seite ist aktuell."
  exit 0
fi

[ -z "$missing" ] || printf 'Fehlt auf der Seite:\n%s\n' "$missing"
[ -z "$stale" ] || printf 'Auf der Seite, aber nicht mehr vorhanden:\n%s\n' "$stale"
exit 1
