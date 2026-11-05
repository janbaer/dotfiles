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

strip_data_heredocs() {
    local out
    out=$(printf '%s\n' "$1" | python3 -I -c '
import re, sys
DATA = {"cat", "jq", "psql", "mysql", "sqlite3", "git", "python", "python3"}
PYTHON = {"python", "python3"}
SAFE_MODULES = {"re", "json", "sys", "collections", "itertools", "datetime", "math", "csv", "textwrap", "string"}
IMPORT = re.compile(r"^\s*(?:import\s+(.+)|from\s+(\w+)[\w.]*\s+import\b)", re.M)
DANGER = re.compile(r"__import__|importlib|\beval\b|\bexec\b|\bcompile\b|getattr|globals|builtins")
OPEN = re.compile(r"(?<!<)<<(-?)\s*([\"\x27])(\w+)\2")
QUOTED = re.compile(r"(<<-?\s*)?(\"[^\"]*\"|\x27[^\x27]*\x27)|\$\(\([^)]*\)\)")

def mask(line):
    return QUOTED.sub(lambda m: m.group(0) if m.group(1) else "Q", line)

def data_opener(line, m):
    head = line[:m.start()].split()
    while head and re.fullmatch(r"\w+=\S*", head[0]):
        head.pop(0)
    if len(head) > 4 or not head or any(re.search(r"[|;&()`$<>]", w) for w in head):
        return None
    cmd = head[0].rsplit("/", 1)[-1]
    if cmd not in DATA or line[m.end():].strip():
        return None
    return cmd

def safe_python(text):
    if DANGER.search(text):
        return False
    for imp in IMPORT.finditer(text):
        names = imp.group(1) or imp.group(2)
        for name in re.split(r"\s*,\s*", names.strip()):
            if name.split()[0].split(".")[0] not in SAFE_MODULES:
                return False
    return True

out, body, delim, dash, cmd = [], [], None, False, None
for line in sys.stdin.read().splitlines():
    if delim is None:
        out.append(line)
        masked = mask(line)
        m = OPEN.search(masked)
        if m:
            cmd = data_opener(masked, m)
            if cmd == "cat" and ">" in masked:
                cmd = None
            dash, delim, body = bool(m.group(1)), m.group(3), []
    elif (line.lstrip("\t") if dash else line) == delim:
        text = "\n".join(body)
        if cmd is None or (cmd in PYTHON and not safe_python(text)):
            out.extend(body)
        out.append(line)
        delim, body = None, []
    else:
        body.append(line)
out.extend(body)
print("\n".join(out))
') || out=$1
    printf '%s\n' "$out"
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
done < <(strip_data_heredocs "$CMD" | sed -E 's/&&|\|\||;/\n/g')

exit 0
