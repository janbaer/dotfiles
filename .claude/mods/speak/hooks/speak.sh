#!/usr/bin/env bash
set -uo pipefail

[[ "$(ps -o pgid= -p $$ | tr -d ' ')" == "$$" ]] || exec setsid bash "$0" "$@"

voice="$1"
instructions="${2:-}"
model="google/gemini-3.8-flash-lite-tts"
max_parallel=3

[[ -n "${OPENROUTER_TTS_API_KEY:-}" ]] || {
  echo "OPENROUTER_TTS_API_KEY is not set" >&2
  exit 2
}

rundir="${XDG_RUNTIME_DIR:-}"
if [[ -z "$rundir" ]]; then
  rundir="${TMPDIR:-/tmp}/claude-speak-$(id -u)"
  mkdir -m 700 "$rundir" 2>/dev/null
  [[ -d "$rundir" && ! -L "$rundir" && -O "$rundir" && "$(ls -ld "$rundir")" == drwx------* ]] || {
    echo "$rundir is not a private directory of this user" >&2
    exit 2
  }
fi
pidfile="$rundir/claude-speak.pid"
old=""
[[ -L "$pidfile" ]] || old="$(cat "$pidfile" 2>/dev/null)"
[[ -n "$old" ]] && grep -aq speak.sh "/proc/$old/cmdline" 2>/dev/null && kill -TERM -- "-$old" 2>/dev/null
rm -f "$pidfile"
(set -C && echo $$ >"$pidfile") || exit 2

dir="$(mktemp -d)"
cleanup() {
  trap '' TERM
  trap - EXIT INT
  [[ "$(cat "$pidfile" 2>/dev/null)" == "$$" ]] && rm -f "$pidfile"
  rm -rf "$dir"
  kill -TERM -- "-$$" 2>/dev/null
}
trap cleanup EXIT
trap 'exit 143' TERM INT

mapfile -t chunks
n=${#chunks[@]}

fetch() {
  local i="$1" body
  body="$(jq -n --arg m "$model" --arg i "${chunks[i]}" --arg v "$voice" --arg s "$instructions" \
    '{model: $m, input: $i, voice: $v, response_format: "pcm"} + (if $s == "" then {} else {instructions: $s} end)')"
  if printf 'Authorization: Bearer %s\n' "$OPENROUTER_TTS_API_KEY" |
    curl -sS --fail-with-body --max-time 120 -o "$dir/$i.tmp" https://openrouter.ai/api/v1/audio/speech \
      -H @- -H 'Content-Type: application/json' -d "$body" 2>"$dir/$i.log"; then
    mv "$dir/$i.tmp" "$dir/$i.pcm"
  else
    head -c 300 "$dir/$i.tmp" >>"$dir/$i.log" 2>/dev/null
    : >"$dir/$i.err"
  fi
}

play() {
  local i
  for ((i = 0; i < n; i++)); do
    until [[ -e "$dir/$i.pcm" || -e "$dir/$i.err" ]]; do sleep 0.05; done
    if [[ -e "$dir/$i.err" ]]; then
      cat "$dir/$i.log" >&2
      return 1
    fi
    cat "$dir/$i.pcm"
  done
}

play | mpv --really-quiet --no-terminal --demuxer=rawaudio --demuxer-rawaudio-rate=24000 \
  --demuxer-rawaudio-channels=1 --demuxer-rawaudio-format=s16le - &
player=$!

for ((i = 0; i < n; i++)); do
  compgen -G "$dir/*.err" >/dev/null && break
  while (($(jobs -rp | wc -l) > max_parallel)); do wait -n; done
  fetch "$i" &
done

wait "$player"
