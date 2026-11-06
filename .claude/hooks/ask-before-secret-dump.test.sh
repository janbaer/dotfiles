#!/usr/bin/env bash
HOOK="$(dirname "$0")/ask-before-secret-dump.sh"
fail=0

check() {
    local expect=$1 cmd=$2 out got
    out=$(jq -n --arg c "$cmd" '{tool_input: {command: $c}}' | "$HOOK")
    [[ $out == *'"ask"'* ]] && got=ask || got=pass
    if [[ $got != "$expect" ]]; then
        echo "FAIL (expected $expect, got $got): $cmd"
        fail=1
    fi
}

check pass $'python3 - <<\'EOF\'\nimport re\nre.search(r"a|env|b", x)\nEOF'
check pass $'python3 <<\'EOF\'\nprint(1)\nEOF\necho done'
check pass $'cat <<\'EOF\' > f\nenv\nprintenv\nEOF'
check pass $'cd x && cat <<-\'EOF\'\n\tenv\n\tEOF'
check pass $'jq . <<\'EOF\'\n{"a": "cat .env"}\nEOF'
check ask  $'python3 - <<\'EOF\'\nimport os\nprint(os.environ)\nEOF'
check ask  $'node <<\'EOF\'\nconsole.log(process.env)\nEOF'
check ask  $'python3 <<\'EOF\'\nimport subprocess\nsubprocess.run("env")\nEOF'
check ask  $'bash <<\'EOF\'\nenv\nEOF'
check ask  $'ssh host <<\'EOF\'\nenv\nEOF'
check ask  $'cat <<\'EOF\' | bash\nenv\nEOF'
check ask  $'cat <<EOF\n$(env)\nEOF'
check ask  $'cat <<\'EOF\'\nx\nEOF\nenv'
check ask  $'echo "<<\'EOF\'"\nenv\nEOF'
check ask  $'cat <<\'EOF\'\nenv'
check ask  'env'
check ask  'cat .env'
check ask  'docker exec x env'
check pass 'env | cut -d= -f1'
check pass 'cat .env.example'

exit $fail
