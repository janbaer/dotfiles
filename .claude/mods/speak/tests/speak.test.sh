#!/usr/bin/env bash
set -uo pipefail

script="$(cd "$(dirname "$0")/.." && pwd)/hooks/speak.sh"
work="$(mktemp -d)"
trap 'pkill -P $$ 2>/dev/null; rm -rf "$work"' EXIT
failed=0

check() {
  if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; failed=1; fi
}

mkdir -p "$work/bin"
cat >"$work/bin/curl" <<'FAKE'
#!/usr/bin/env bash
while (($#)); do case "$1" in -o) out="$2"; shift 2;; *) shift;; esac; done
printf 'pcm' >"$out"
FAKE
cat >"$work/bin/mpv" <<'FAKE'
#!/usr/bin/env bash
cat >/dev/null
sleep "${FAKE_PLAY:-0}"
FAKE
chmod +x "$work/bin/curl" "$work/bin/mpv"

export PATH="$work/bin:$PATH" OPENROUTER_TTS_API_KEY=test TMPDIR="$work/tmp"
mkdir -p "$TMPDIR"
unset XDG_RUNTIME_DIR
rundir="$TMPDIR/claude-speak-$(id -u)"
victim="$work/victim"

speak() { printf 'eins\n' | bash "$script" Kore 2>"$work/err"; }

echo precious >"$victim"
mkdir -m 775 "$rundir"
chmod 775 "$rundir"
ln -s "$victim" "$rundir/claude-speak.pid"
speak
check "permissive directory with a planted pidfile symlink is refused" '[[ $? -eq 2 ]]'
check "the symlink target stays unchanged" '[[ "$(cat "$victim")" == precious ]]'

chmod 700 "$rundir"
speak
check "a private directory with a planted symlink is replaced, not followed" '[[ $? -eq 0 && "$(cat "$victim")" == precious ]]'

rm -rf "$rundir"
ln -s "$work" "$rundir"
speak
check "a symlinked runtime directory is refused" '[[ $? -eq 2 ]]'
rm -f "$rundir"

FAKE_PLAY=30 bash -c 'printf "eins\n" | bash "$0" Kore' "$script" &
first=$!
for _ in $(seq 50); do [[ -s "$rundir/claude-speak.pid" ]] && break; sleep 0.1; done
speak
for _ in $(seq 30); do kill -0 "$first" 2>/dev/null || break; sleep 0.1; done
check "a second start cancels the first one in another session" '! kill -0 "$first" 2>/dev/null'

exit "$failed"
