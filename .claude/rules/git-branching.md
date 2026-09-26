# Git branching

Before committing a fix intended for upstream, create a standalone feature branch off the upstream default branch. Never commit the fix directly onto a local integration branch (a branch that only exists to combine several sources or track a fork, e.g. `mailbox`).

## Why

A commit on a local integration branch carries baggage from that branch: it cannot be cleanly opened as a PR against upstream, and it mixes local-only history into a change that should stand on its own.

## How to apply

- Identify the upstream default branch (usually `main` or `master` on the upstream remote) before branching.
- Branch from that, not from the local integration branch.
- Keep the fix on its own branch until it is merged upstream.

## Branch names

Every branch starts with `feature/`: `feature/{N}-{slug}` when an issue exists, `feature/{slug}` otherwise. No `chore/`, `fix/` or other prefixes, whatever the kind of change.

Check the current branch name before the first commit on it, also when the branch was created by someone or something else. A wrong name is cheap to fix with `git branch -m` while the branch is unpushed, and turns into a closed PR and a re-push once it is on the remote.
