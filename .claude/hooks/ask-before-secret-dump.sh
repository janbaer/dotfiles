#!/usr/bin/env bash

INPUT=$(cat)

read -r -d '' PREPROCESS <<'PY'
import sys, json, re, os

cmd = json.load(sys.stdin).get('tool_input', {}).get('command', '')

OPEN = re.compile(r"""(?<!<)<<(-?)\s*(['"])(\w+)\2""")
DATA = {'cat', 'tee', 'jq', 'psql', 'mysql', 'sqlite3', 'git', 'sed', 'awk', 'grep', 'tr', 'wc', 'sort'}
INTERP = {'python', 'node', 'bun', 'deno', 'ruby', 'perl', 'php'}
ENV_ACCESS = re.compile(r'environ|getenv|process\.env|Deno\.env|Bun\.env|\bENV\[|subprocess|os\.system|popen|child_process|execSync|spawnSync|\bsystem\(|\bexec\(')


def command_word(prefix):
    seg = re.split(r'[;&|]', prefix)[-1].strip()
    seg = re.sub(r'^([A-Za-z_]\w*=\S*\s+)*', '', seg)
    word = os.path.basename(seg.split()[0]) if seg.split() else ''
    return re.sub(r'^(python)[\d.]+$', r'\1', word)


lines = cmd.split('\n')
out = []
env_access = False
i = 0
while i < len(lines):
    line = lines[i]
    out.append(line)
    i += 1
    m = OPEN.search(line)
    if not m:
        continue
    prefix, rest = line[:m.start()], line[m.end():]
    if re.search(r'["\'`]|\$\(', prefix) or re.search(r'[|`]|\$\(|<<', rest):
        continue
    word = command_word(prefix)
    if word not in DATA and word not in INTERP:
        continue
    dash, delim = m.group(1), m.group(3)
    end = next((k for k in range(i, len(lines))
                if (lines[k].lstrip('\t') if dash else lines[k]) == delim), None)
    if end is None:
        continue
    if word in INTERP and ENV_ACCESS.search('\n'.join(lines[i:end])):
        env_access = True
    i = end + 1

if env_access:
    out.append('__HEREDOC_ENV_ACCESS__')
print('\n'.join(out))
PY

CMD=$(echo "$INPUT" | python3 -c "$PREPROCESS" 2>/dev/null)

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
    if [[ $stmt == *__HEREDOC_ENV_ACCESS__* ]]; then
        ask "Ein Skript im Heredoc liest die Umgebung oder startet Prozesse, dabei können Secrets ausgegeben werden."
    fi

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
