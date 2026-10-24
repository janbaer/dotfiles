# Git branching

Before committing a fix intended for upstream, create a standalone feature branch off the upstream default branch. Never commit the fix directly onto a local integration branch (a branch that only exists to combine several sources or track a fork, e.g. `mailbox`).

## Why

A commit on a local integration branch carries baggage from that branch: it cannot be cleanly opened as a PR against upstream, and it mixes local-only history into a change that should stand on its own.

## How to apply

- Identify the upstream default branch (usually `main` or `master` on the upstream remote) before branching.
- Branch from that, not from the local integration branch.
- Keep the fix on its own branch until it is merged upstream.

## Small changes in own repos

Not a fixed rule: the process scales with the change. A trivial change in a repo Jan owns (one value, an address, a typo) is committed directly on the default branch, with no feature branch and no review pair. Larger changes get the full workflow. When unsure which side a change falls on, ask.

A version or image-tag bump that Jan starts himself in a repo he owns counts as trivial: it goes directly on the default branch, with the CHANGELOG entry (if it earns one) in the same commit. No branch, no PR, no reviewer. This holds for all of Jan's own repos, which are all private projects, and it holds even when an issue exists. Renovate PRs are the exception. They already exist as PRs and have their own skill.

## Branch names

Every branch starts with `feature/`: `feature/{N}-{slug}` when an issue exists, `feature/{slug}` otherwise. No `chore/`, `fix/` or other prefixes, whatever the kind of change.

Check the current branch name before the first commit on it, also when the branch was created by someone or something else. A wrong name is cheap to fix with `git branch -m` while the branch is unpushed, and turns into a closed PR and a re-push once it is on the remote.
