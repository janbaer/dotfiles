#!/usr/bin/env bash
set -euo pipefail

VAULT="Notes"

usage() {
  echo "usage: ideas.sh list | add <title> <text>" >&2
  exit 2
}

slugify() {
  printf '%s' "$1" |
    sed -e 's/[äÄ]/ae/g; s/[öÖ]/oe/g; s/[üÜ]/ue/g; s/ß/ss/g' |
    tr '[:upper:]' '[:lower:]' |
    tr -c 'a-z0-9\n' ' ' |
    awk '{ n = (NF < 5 ? NF : 5); for (i = 1; i <= n; i++) printf "%s%s", $i, (i < n ? "-" : "") }'
}

list_ideas() {
  obsidian vault="$VAULT" search:context query='/^titel: /' path="Ideas" |
    grep -v '^Ideas/Archiv/' |
    sed -n 's|^Ideas/\([^:]*\)\.md:[0-9]*: titel: \(.*\)$|\1\t\2|p' |
    sort |
    while IFS=$'\t' read -r name title; do
      printf '%s\t%s\t%s\n' "$name" "${name:0:10}" "$title"
    done
}

add_idea() {
  local title="$1" text="$2" date slug name
  date=$(date +%F)
  slug=$(slugify "$title")
  name="${date}-${slug}"
  obsidian vault="$VAULT" create path="Ideas/${name}.md" content="---
tags: [idee]
datum: ${date}
titel: ${title}
status: offen
repo:
---

# ${title}

${text}
" > /dev/null
  echo "$name"
}

case "${1:-}" in
  list) list_ideas ;;
  add)
    [ $# -eq 3 ] || usage
    add_idea "$2" "$3"
    ;;
  *) usage ;;
esac
