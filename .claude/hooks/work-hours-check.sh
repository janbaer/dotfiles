#!/usr/bin/env bash
# Warnt wenn private Projekte während der Arbeitszeit (Mo-Fr 9-18 Uhr) bearbeitet werden

DAY=$(date +%u)   # 1=Mo ... 7=So
HOUR=$(date +%H)  # 00-23

# Nur Mo-Fr zwischen 9 und 18 Uhr prüfen
if [ "$DAY" -ge 1 ] && [ "$DAY" -le 5 ] && [ "$HOUR" -ge 9 ] && [ "$HOUR" -lt 18 ]; then
    INPUT=$(cat)
    FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

    if [ -n "$FILE_PATH" ]; then
        if ! echo "$FILE_PATH" | grep -qE "(check24|dotfiles)"; then
            echo "⚠️  Arbeitszeit (Mo–Fr 9–18 Uhr): Du bearbeitest gerade ein privates Projekt. Wirklich fortfahren?" >&2
            exit 2
        fi
    fi
fi

exit 0
