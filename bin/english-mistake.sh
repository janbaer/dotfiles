#!/usr/bin/env bash
set -euo pipefail

# Usage: english-mistake.sh <original> <issue> <better> <pattern>
# Appends one row to the English mistake collection in the Obsidian vault.
# Writes the file directly instead of going through the Obsidian CLI so it
# also works while Obsidian is not running.

note="$HOME/Documents/Obsidian/English/language-mistakes.md"

if [ $# -ne 4 ]; then
  echo "usage: $(basename "$0") <original> <issue> <better> <pattern>" >&2
  exit 1
fi

cell() { printf '%s' "$1" | tr '\n' ' ' | sed 's/|/\\|/g'; }

if [ ! -f "$note" ]; then
  mkdir -p "$(dirname "$note")"
  cat > "$note" <<EOF
---
tags:
  - english
  - language-learning
created: $(date +%F)
---

# English language mistakes

Collected by the english-tutor rule whenever a correction comes up in one of my
prompts. Run \`/english-review\` to go through the recurring patterns.

| Date | I wrote | Issue | Better | Pattern |
| --- | --- | --- | --- | --- |
EOF
fi

printf '| %s | %s | %s | %s | %s |\n' \
  "$(date +%F)" "$(cell "$1")" "$(cell "$2")" "$(cell "$3")" "$(cell "$4")" >> "$note"
