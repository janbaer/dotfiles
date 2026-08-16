#!/usr/bin/env bash
set -euo pipefail

# The mailbox.org MCP servers run from local clones instead of npm. Two of them
# are forks carrying fixes that upstream has not merged yet, and the IMAP one
# was never published. Run this on a new machine, or after a fork gained a
# commit, so ~/Projects/.mcp.json finds a current dist/ to point at.
#
# Forgetting the build is the failure mode worth knowing about: a server that
# is already running keeps the old code in memory, so a stale dist/ looks like
# everything is fine until the next restart.

PROJECTS="$HOME/Projects"

SERVERS=(
  "https://github.com/florianbuetow/imap-mini-mcp.git|main"
  "https://github.com/janbaer/caldav-mcp.git|mailbox"
  "https://github.com/janbaer/carddav-mcp.git|mailbox"
)

for entry in "${SERVERS[@]}"; do
  url="${entry%%|*}"
  branch="${entry##*|}"
  name="$(basename "$url" .git)"
  dir="$PROJECTS/$name"

  echo "==> $name ($branch)"

  if [[ -d $dir/.git ]]; then
    git -C "$dir" fetch --all --quiet
    current="$(git -C "$dir" branch --show-current)"
    if [[ $current != "$branch" ]]; then
      echo "    on '$current' instead of '$branch', leaving the checkout alone"
    elif ! git -C "$dir" merge --ff-only '@{u}' --quiet 2>/dev/null; then
      echo "    no upstream to fast-forward, keeping what is there"
    fi
    if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
      echo "    uncommitted changes present, building them as they are"
    fi
  else
    git clone --quiet --branch "$branch" "$url" "$dir"
    echo "    cloned"
  fi

  # cd rather than --prefix: --prefix picks the install target but leaves the
  # working directory alone, and these projects run lefthook from their
  # prepare script, which would then install git hooks into whatever repo the
  # script happened to be started from.
  #
  # ci over install: it installs exactly what the lockfile says and leaves the
  # file alone, so a plain setup run does not show up as a local change.
  (
    cd "$dir"
    npm ci --silent --no-audit --no-fund
    npm run build --silent
  )

  if [[ -f $dir/dist/index.js ]]; then
    echo "    built"
  else
    echo "    build produced no dist/index.js" >&2
    exit 1
  fi
done

echo
echo "All three built. Restart Claude Code so the servers pick up the new dist."
