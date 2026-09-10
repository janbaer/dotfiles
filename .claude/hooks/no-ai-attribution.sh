#!/usr/bin/env bash
# Blockiert git commit, wenn die Message KI-Attribution enthält (siehe commits.md)

INPUT=$(cat)

eval "$(echo "$INPUT" | python3 -c "
import sys, json, shlex
d = json.load(sys.stdin)
print('CMD=' + shlex.quote(d.get('tool_input', {}).get('command', '')))
" 2>/dev/null)"

if ! echo "$CMD" | grep -qE '(^|[;&|[:space:]])git([[:space:]]+-[^[:space:]]+)*[[:space:]]+commit([[:space:]]|$)'; then
    exit 0
fi

if echo "$CMD" | grep -qE 'Co-Authored-By: *Claude|Claude-Session:'; then
    echo "Die Commit-Message enthält KI-Attribution (Co-Authored-By: Claude / Claude-Session). commits.md verbietet das: ein Commit soll aussehen, als hätte Jan ihn geschrieben. Zeilen entfernen und erneut committen." >&2
    exit 2
fi

exit 0
