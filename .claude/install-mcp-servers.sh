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

install_mcp() {
  if claude mcp get "$1" >/dev/null 2>&1; then
    if [ "$update" -eq 0 ]; then
      echo "$1: already installed"
      return
    fi
    claude mcp remove -s user "$1" || { failed+=("$1"); return; }
  fi
  claude mcp add-json -s user "$1" "$2" || failed+=("$1")
}

install_mcp context7 '{"type":"http","url":"https://mcp.context7.com/mcp"}'

# HOWCANI_TOKEN must be set in the shell profile, Claude expands it at runtime
install_mcp howcani-mcp '{"type":"http","url":"https://howcani.home.janbaer.de/mcp","headers":{"Authorization":"Bearer ${HOWCANI_TOKEN}"}}'

if [ ${#failed[@]} -gt 0 ]; then
  printf 'failed: %s\n' "${failed[*]}" >&2
  exit 1
fi
