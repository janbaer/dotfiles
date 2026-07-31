#!/usr/bin/env bash
# Blockiert git commit in Repos, deren origin auf gitlab.com liegt (Arbeitsrepos)

INPUT=$(cat)

eval "$(echo "$INPUT" | python3 -c "
import sys, json, shlex
d = json.load(sys.stdin)
print('CMD=' + shlex.quote(d.get('tool_input', {}).get('command', '')))
print('CWD=' + shlex.quote(d.get('cwd', '')))
" 2>/dev/null)"

if ! echo "$CMD" | grep -qE '(^|[;&|[:space:]])git([[:space:]]+-[^[:space:]]+)*[[:space:]]+(commit|revert)([[:space:]]|$)'; then
    exit 0
fi

ORIGIN=$(git -C "${CWD:-.}" remote get-url origin 2>/dev/null)

if echo "$ORIGIN" | grep -qE '(^|[@/])gitlab\.com([:/]|$)'; then
    echo "Dieses Repository hat sein origin auf gitlab.com. Für GitLab-Repos werden keine KI-generierten Commits erstellt, bitte den Commit manuell schreiben." >&2
    exit 2
fi

exit 0
