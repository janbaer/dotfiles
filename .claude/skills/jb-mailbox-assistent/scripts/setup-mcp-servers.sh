#!/usr/bin/env bash
set -euo pipefail

# The mailbox.org MCP servers run from local clones instead of npm. Two of them
# are forks carrying fixes that upstream has not merged yet, and the IMAP one
# is upstream's own repo, which was never published. Run this on a new machine,
# or after a fork gained a commit, so ~/Projects/.mcp.json finds a current
# dist/ to point at.
#
# Forgetting the build is the failure mode worth knowing about: a server that
# is already running keeps the old code in memory, so a stale dist/ looks like
# everything is fine until the next restart.

PROJECTS="$HOME/Projects"

# The two forks carry their fixes on a branch called mailbox. The IMAP server
# needs no fork any more, all its fixes are merged upstream.
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
    synced="$(git -C "$dir" rev-parse --verify --quiet '@{u}' || true)"
    git -C "$dir" fetch --all --quiet
    current="$(git -C "$dir" branch --show-current)"
    if [[ $current != "$branch" ]]; then
      echo "    on '$current' instead of '$branch', leaving the checkout alone"
    elif ! git -C "$dir" rev-parse --verify --quiet '@{u}' >/dev/null; then
      echo "    no upstream configured, keeping what is there"
    elif ! git -C "$dir" merge --ff-only '@{u}' --quiet 2>/dev/null; then
      # The fork branches get rebuilt and force-pushed. A checkout that was
      # level with the remote before the fetch has no work of its own and can
      # follow the rewrite; anything else is left for a human, because
      # building the stale code and reporting success is the failure this
      # script exists to avoid.
      if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
        echo "    '$branch' diverged from upstream and has uncommitted changes, resolve by hand" >&2
        exit 1
      elif [[ $synced == "$(git -C "$dir" rev-parse HEAD)" ]]; then
        echo "    upstream was rewritten, resetting '$branch' to it"
        git -C "$dir" reset --hard --quiet '@{u}'
      else
        echo "    '$branch' has local commits upstream does not, resolve by hand" >&2
        exit 1
      fi
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
  #
  # --ignore-scripts: these are runtime checkouts, so the prepare script is not
  # needed. It fails where git's hooksPath is set globally, and npm ci would
  # then exit non-zero before the build.
  (
    cd "$dir"
    npm ci --ignore-scripts --silent --no-audit --no-fund
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
