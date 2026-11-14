#!/usr/bin/env bash
# Usage: bench.sh [-n runs] [model ...]
# Without models, every slug in candidates.txt is benchmarked.
set -euo pipefail

dir=$(dirname "$(readlink -f "$0")")
runs=3
if [[ ${1:-} == -n ]]; then
  runs=$2
  shift 2
fi
models=("$@")
((${#models[@]})) || mapfile -t models < <(grep -v '^\s*$' "$dir/candidates.txt")
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is not set}"

out=${XDG_STATE_HOME:-$HOME/.local/state}/claude-model-router/bench-$(date +%Y%m%dT%H%M%S).jsonl
mkdir -p "$(dirname "$out")"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

bench_model() {
  local model=$1 id=0 line request response latency
  while IFS= read -r line; do
    ((++id))
    request=$(jq --arg model "$model" --argjson case "$line" \
      '{model: $model, state: $case.prompt, questions: (with_entries(.value |= ({type: "choice"} + .)))}' "$dir/criteria.json")
    for ((run = 1; run <= runs; run++)); do
      response=$(curl -sS -m 15 -w '\n%{time_total}' https://openrouter.ai/api/alpha/decisions \
        -H "Authorization: Bearer $OPENROUTER_API_KEY" \
        -H "Content-Type: application/json" -d "$request" 2>&1) || true
      latency=${response##*$'\n'}
      jq -nc --arg model "$model" --argjson id "$id" --argjson case "$line" \
        --arg body "${response%$'\n'*}" --arg latency "$latency" '
        ($body | try fromjson catch null) as $r | {
          model: $model, id: $id, expected: $case.expected, expected_effort: $case.expected_effort,
          choice: $r.answers.model.choice, confidence: $r.answers.model.confidence,
          effort: $r.answers.effort.choice,
          latency: ($latency | tonumber? // null), cost: ($r.usage.cost // 0),
          error: (if $r.answers.model.choice then null else $body[0:200] end)
        }'
    done
  done <"$dir/dataset.jsonl" >"$tmp/${model//\//_}.jsonl"
}

echo "${#models[@]} models x $(grep -c . "$dir/dataset.jsonl") prompts x $runs runs" >&2
for model in "${models[@]}"; do
  bench_model "$model" &
done
wait
cat "$tmp"/*.jsonl >"$out"

jq -rs '
  {haiku: 0, sonnet: 1, opus: 2, fable: 3} as $tier
  | {low: 0, medium: 1, high: 2, xhigh: 3} as $etier
  | def pct(a; b): if b == 0 then "-" else (100 * a / b | round | tostring) + "%" end;
    def q(p): sort | if length == 0 then null else .[((length - 1) * p | floor)] end;
  ["model", "acc", "under", "over", "eff", "e-under", "e-over", "stable", "errors", "p50", "p95", "cost"],
  (group_by(.model)[]
    | (map(select(.error == null))) as $ok
    | ($ok | map(.latency)) as $lat
    | [ .[0].model,
        pct($ok | map(select(.choice == .expected)) | length; $ok | length),
        pct($ok | map(select($tier[.choice] < $tier[.expected])) | length; $ok | length),
        pct($ok | map(select($tier[.choice] > $tier[.expected])) | length; $ok | length),
        pct($ok | map(select(.effort == .expected_effort)) | length; $ok | length),
        pct($ok | map(select(.effort != null and $etier[.effort] < $etier[.expected_effort])) | length; $ok | length),
        pct($ok | map(select(.effort != null and $etier[.effort] > $etier[.expected_effort])) | length; $ok | length),
        pct($ok | group_by(.id) | map(select(map(.choice) | unique | length == 1)) | length;
            $ok | map(.id) | unique | length),
        (map(select(.error)) | length),
        ($lat | q(0.5) | if . then "\(. * 1000 | round)ms" else "-" end),
        ($lat | q(0.95) | if . then "\(. * 1000 | round)ms" else "-" end),
        "$\(map(.cost) | add * 10000 | round / 10000)" ])
  | @tsv' "$out" | { read -r header; echo "$header"; sort -t$'\t' -k2,2nr; } | column -t -s$'\t'
echo "raw results: $out" >&2
