#!/usr/bin/env bash
# Erinnert bei "How can/do/would I"-Fragen daran, zuerst die howcani-Skill zu nutzen

INPUT=$(cat)

PROMPT=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('prompt', ''))
except Exception:
    print('')
" 2>/dev/null)

# How-to-Phrasing erkennen (case-insensitive): how can/do/would/should/to I/we/you
if echo "$PROMPT" | grep -qiE "how (can|do|would|should|could|to|might) (i|we|you)\b"; then
    python3 -c "
import json
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'UserPromptSubmit',
        'additionalContext': 'This is a how-to question. Before answering, invoke the howcani skill and search the howcani-mcp knowledge base first.'
    }
}))
"
fi

exit 0
