#!/usr/bin/env bash

INPUT=$(cat)

CMD=$(echo "$INPUT" | python3 -c "
import sys, json
print(json.load(sys.stdin).get('tool_input', {}).get('command', ''))
" 2>/dev/null)

NAMES_ONLY='\|[^|]*(cut[[:space:]]+-d[[:space:]]*.?=.?[[:space:]]+-f[[:space:]]*1([^0-9]|$)|sed[^|]*s/=\.\*/|awk[[:space:]]+-F[[:space:]]*.?=.?[^|]*print[[:space:]]+\$1)'
BARE_ENV='(^|[;&|(])[[:space:]]*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*(env|printenv)[[:space:]]*($|[;&|)])'
EXEC_ENV='(docker|kubectl)([[:space:]]+[^[:space:]]+)*[[:space:]]+exec[[:space:]].*[[:space:]](env|printenv)([[:space:]]|$|[;&|)"'"'"'])'
SSH_ENV='ssh[[:space:]]+(-[^[:space:]]+[[:space:]]+)*[^[:space:]]+[[:space:]]+["'"'"']?(env|printenv)["'"'"']?[[:space:]]*($|[;&|])'
INSPECT='docker[[:space:]]+(container[[:space:]]+)?inspect([[:space:]]|$)'
ENV_FILE='(cat|less|more|head|tail|bat|tac|nl|grep|sed|awk)[[:space:]]+([^;&|]*[/[:space:]"'"'"'])?(\.env(\.[A-Za-z0-9_-]+)?|[A-Za-z0-9_.-]+\.env)($|[[:space:]"'"'"';&|])'
ENV_TEMPLATE='\.env\.(example|sample|template|dist)'
VAULT='ansible-vault[[:space:]]+(view|decrypt|edit)|sops[[:space:]]+([^|;&]*[[:space:]])?(-d|--decrypt|decrypt)([[:space:]]|$)|age[[:space:]]+([^|;&]*[[:space:]])?(-d|--decrypt)([[:space:]]|$)'

ask() {
    printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$1"
    exit 0
}

while IFS= read -r stmt; do
    echo "$stmt" | grep -qE "$NAMES_ONLY" && continue

    if echo "$stmt" | grep -qE "$BARE_ENV|$EXEC_ENV|$SSH_ENV"; then
        ask "Der Befehl gibt die komplette Umgebung aus, inklusive Secrets. Nur Namen ausgeben (| cut -d= -f1) oder einen einzelnen Namen abfragen."
    fi

    if echo "$stmt" | grep -qE "$INSPECT"; then
        if ! echo "$stmt" | grep -qE '(-f|--format)[[:space:]=]' || echo "$stmt" | grep -qE '\.Config|\.Env|json'; then
            ask "docker inspect enthält die Container-Umgebung mit Secrets. Mit --format auf einzelne Felder einschränken."
        fi
    fi

    if echo "$stmt" | sed -E "s/$ENV_TEMPLATE/TEMPLATE/g" | grep -qE "$ENV_FILE"; then
        ask "Der Befehl gibt den Inhalt einer .env-Datei aus. Nur die Namen ausgeben oder die Datei nicht anzeigen."
    fi

    if echo "$stmt" | grep -qE "$VAULT"; then
        ask "Der Befehl entschlüsselt ein Vault oder gibt dessen Inhalt aus."
    fi
done < <(echo "$CMD" | sed -E 's/&&|\|\||;/\n/g')

exit 0
