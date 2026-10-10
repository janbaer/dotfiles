#!/usr/bin/env bash
set -uo pipefail

update=0
case ${1-} in
--update) update=1 ;;
"") ;;
*)
  echo "usage: ${0##*/} [--update]" >&2
  exit 2
  ;;
esac

failed=()

is_installed() {
  claude plugin list --json | python3 -c '
import json, sys
sys.exit(0 if any(p["id"] == sys.argv[1] and p["scope"] == "user" for p in json.load(sys.stdin)) else 1)
' "$1"
}

has_marketplace() {
  claude plugin marketplace list --json | python3 -c '
import json, sys
sys.exit(0 if any(m["name"] == sys.argv[1] for m in json.load(sys.stdin)) else 1)
' "$1"
}

install_plugin() {
  if is_installed "$1"; then
    if [ "$update" -eq 0 ]; then
      echo "$1: already installed"
      return
    fi
    claude plugin update "$1" || failed+=("$1")
    return
  fi
  if ! has_marketplace "${1#*@}"; then
    claude plugin marketplace add "$2" || { failed+=("$1"); return; }
  fi
  claude plugin install "$1" || failed+=("$1")
}

install_plugin filetree@claude-code-filetree data-goblin/claude-code-filetree
install_plugin next-steps@claude-code-mods hamzafer/claude-code-mods
install_plugin savvy-progress@claude-kit JohnnyVizz/claude-kit

# Not installed from here, on purpose:
#   redact-secrets, ideas-pane    own mods, marketplace jan-mods points at .claude/mods (user-settings.json)

if [ ${#failed[@]} -gt 0 ]; then
  printf 'failed: %s\n' "${failed[*]}" >&2
  exit 1
fi
