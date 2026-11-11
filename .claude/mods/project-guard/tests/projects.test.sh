#!/usr/bin/env bash
set -uo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
projects="${1:-$root/projects.json}"
table="${2:-$root/../../rules/ask-peer-sessions.md}"
failed=0

folders="$(gojq -er '.[].folder' "$projects")" || {
  echo "FAIL cannot read folders from $projects"
  exit 1
}

while IFS= read -r folder; do
  if grep -q "^|.*| \`$folder\` |$" "$table"; then
    echo "ok   $folder is in the peer session table"
  else
    echo "FAIL $folder is missing from the peer session table"
    failed=1
  fi
done <<<"$folders"

exit $failed
