---
name: forgejo-release
model: sonnet
description: Use when releasing what has been merged to main in a Forgejo repository with release machinery (scripts/bump-version.ts and CHANGELOG.md). Trigger on phrases like "release", "cut a release", "deploy a new version", "bump the version". Bumps the version, writes the changelog entry for every change since the last release and pushes to main, which starts the image build and deploy.
disable-model-invocation: true
---

# Forgejo Release

Releases everything merged to `main` since the last release: one version bump, one
changelog entry, one push. Only changes to the product release; tooling and process
changes wait for the next release. **forgejo-pr-merge** calls it after every merge unless it
was told `no-release`; called on its own, it ships whatever was merged that way.

Optional argument: `patch` (default), `minor` or `major` for the bump.

## Steps

### 1. Check the repository

Both `scripts/bump-version.ts` and `CHANGELOG.md` must exist. If one is missing, stop:
"This repository has no release machinery."

The working tree must be clean:

```bash
git status --porcelain --untracked-files=no
# any output → stop: "The working tree has uncommitted changes. Commit or stash them, then release again."
```

Run it on its own and read the output; it exits 0 either way.

### 2. Update main

```bash
git switch main
git pull --ff-only origin main
```

If the pull is not a fast-forward, stop and report it. Local `main` has commits that are
not on origin, and those would ship unreviewed.

### 3. Find what is unreleased

The last release is the last commit that changed the version in `package.json`:

```bash
last=$(git log -1 --format=%H -G'"version"' -- package.json)
git log --oneline "$last"..HEAD
```

No output → stop: "Nothing merged since <version>, nothing to release."

Only changes to the product earn a new version. Sort every commit by its diff
(`git show --stat <sha>`), not by its subject:

| Releases | Does not release |
|---|---|
| Behaviour changes and bug fixes: application code (`src/`), runtime dependencies in `package.json` and `bun.lock`, `Dockerfile` | Tooling and process: CI workflows, `renovate.json`, linter and hook config, review rules, `docs/`, `openspec/`, devDependencies only |

A Renovate PR that bumps a runtime dependency releases; one that only touches
devDependencies does not.

No commit in the left column → stop without bumping: "Nothing since <version> changes
the product, no release." The commits stay unreleased and go out with the next release
that has one, so the changelog mentions them only if they are worth it there.

### 4. Bump the version

```bash
bun run scripts/bump-version.ts <patch|minor|major>   # patch unless the user said otherwise
```

### 5. Write the changelog entry

Invoke the **update-changelog** skill with the new version number. It reads the commits
from step 3 and writes one entry covering all of them. The squash commits carry the PR
titles and numbers; for the motivation behind a change, read the PR with
`get_pull_request_by_index`.

### 6. Commit

```bash
git add package.json CHANGELOG.md
git commit -m "release 🔧: Releasing <version> with <the reason in a few words>"
```

### 7. Push

```bash
git push origin main
```

The `pre-push` hook builds and tests. If it fails, or the push is rejected, stop and
report the output; the release commit stays local. Do not retry with `--force` and do
not push the commit through a branch or PR instead.

### 8. Notify

Invoke the `ntfy-me` skill:

> Released <version> of `<repo>`: <the reason in a few words>

## Related skills

| Skill | Use case |
|-------|----------|
| `forgejo-pr-merge` | Squash-merge an approved PR, then call this skill |
| `update-changelog` | Write the changelog entry for the new version |
