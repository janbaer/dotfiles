#!/usr/bin/env bash
set -uo pipefail

script="$(cd "$(dirname "$0")" && pwd)/projects.test.sh"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
failed=0

check() {
  if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; failed=1; fi
}

printf '| Topic | Folder |\n| --- | --- |\n| Playbooks | `ansible-homelab` |\n' >"$work/table.md"
echo '[{"folder":"ansible-homelab"}]' >"$work/valid.json"
echo '{not json' >"$work/malformed.json"
echo '[{"folder":"ansible-homelab"},{"folder":"nixos-config"}]' >"$work/missing.json"
echo '[]' >"$work/empty.json"

check 'valid list passes' 'bash "$script" "$work/valid.json" "$work/table.md" >/dev/null'
check 'malformed JSON fails' '! bash "$script" "$work/malformed.json" "$work/table.md" >/dev/null 2>&1'
check 'folder missing from the table fails' '! bash "$script" "$work/missing.json" "$work/table.md" >/dev/null'
check 'empty list fails' '! bash "$script" "$work/empty.json" "$work/table.md" >/dev/null 2>&1'

exit $failed
