---
name: forgejo-pr-merge
model: haiku
description: Use when merging (closing) a Pull Request on a Forgejo repository via squash commit. Trigger on phrases like "merge this PR", "merge a PR", "close this PR", "close the PR", "merge PR #N", "squash and merge", or "land this PR". Always use this skill when the user wants to merge or close a PR — even if they don't explicitly say "squash".
disable-model-invocation: true
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**.

# Forgejo PR Merge

Merges a Pull Request using a squash commit, then cleans up the branch locally. In a
repository with the release machinery it also writes the version bump and the changelog
entry first, so that the merge is the release.

Optional argument: `patch` (default), `minor` or `major` for the bump.

## Steps

### 1. Detect repo

```bash
git remote get-url origin
# https://forgejo.example.com/owner/repo.git → owner="owner", repo="repo"
```

### 2. Determine which PR to merge

**If a PR number was passed as an argument** — use it directly.

**If on a feature branch** — check whether a PR exists for the current branch:

```bash
git branch --show-current
```

```
list_repo_pull_requests(owner, repo, state="open")
```

Look for a PR whose `head` matches the current branch. If found, use it.

**If no PR can be determined from context** — list open PRs and ask the user to pick one:

```
list_repo_pull_requests(owner, repo, state="open")
```

Show: `#N — <title> (<head> → <base>)` and wait for selection.

### 3. Read PR details

```
get_pull_request_by_index(owner, repo, index=N)
```

Note the **base branch** — this is where the squash commit will land. It is usually `main` or `master`, but may be another feature branch. Confirm with the user if it looks unexpected (e.g. not `main`/`master`).

Show the user a short summary:

```
PR #N: <title>
<head> → <base>
<PR URL>
```

**Ask for confirmation only if the PR was inferred from context** (matched automatically from the current branch) — not if the user explicitly passed a PR number or selected one from the list. If asking: "Merge this PR?" and wait for confirmation.

### 4. Rebase the head branch onto the base

Other PRs may have landed on the base since this branch was created. Rebasing puts the
branch on top of them, so the `pre-push` hook tests the code that will actually land, and
the version bump starts from the latest released number.

The working tree must be clean, since the head branch gets checked out here:

```bash
git status --porcelain --untracked-files=no
# any output → stop: "The working tree has uncommitted changes. Commit or stash them, then merge again."
```

Run this on its own and read the output. It exits 0 either way, so chaining it with
`&&` never stops anything. Untracked files are ignored: they survive the checkout and
the rebase untouched.

The head branch may not exist locally (a PR from another author), so check it out from origin:

```bash
git fetch origin <base-branch> <head-branch>
git log --oneline origin/<head-branch>..<head-branch> 2>/dev/null
# any output → stop: "The local <head-branch> has commits that are not on origin. Push or drop them, then merge again."
git switch <head-branch>
git reset --hard origin/<head-branch>
git rebase origin/<base-branch>
```

The reset aligns a stale local copy with the PR as it was reviewed. When the branch does
not exist locally, `git switch` creates it from origin and the `git log` check prints nothing.

**On a conflict, never resolve it.** Run `git rebase --abort`, switch back to the base
branch and stop: "PR #N conflicts with <base>. Rebase it on the branch, then merge again."
The conflict goes back to whoever wrote the PR.

**After a rebase that moved the branch, run the tests.** The merge happens before any
review of the rebased code could arrive, so this is the only check on how the PR combines
with what landed on the base in the meantime.

```bash
git rev-parse HEAD origin/<head-branch>
# same SHA → the rebase changed nothing, skip the tests
```

Take the test command from the project: its `CLAUDE.md`, or the `test` script in
`package.json` (for howcani: `bun test --isolate`). If they fail, switch back to the base
branch and stop: "PR #N fails its tests after rebasing onto <base>." No release commit,
no push, no merge.

A project without tests is fine: skip this step and mention it in the final summary.

### 5. Add the release commit

Only for repositories that carry the release machinery — both `scripts/bump-version.ts`
and `CHANGELOG.md` exist, and the base branch is `main` or `master`. Everywhere else
skip to the push.

The version bump and the changelog entry are deliberately **not** part of the review:
they are mechanical, they are written from the PR that was just approved, and keeping
them out of the diff means the reviewer never reads version noise. They ride along in
the squash commit, and on `main` the changed `package.json` is what starts the image
build.

`bump-version.ts` reads the version from the branch's own `package.json`, which is why
the rebase in step 4 has to come first: on a branch behind `main` it would compute a
number that was already released, and the merge would produce no image and no error.

```bash
bun run scripts/bump-version.ts [patch|minor|major]   # patch unless the user said otherwise
```

Invoke the **update-changelog** skill with the new version number. It detects the
existing format and writes the motivation, which comes from the PR title and body and
from the commits between base and head — the same material the review was based on.

```bash
git add package.json CHANGELOG.md
git commit -m "release 🔧: Releasing <version> with <the reason in a few words>"
```

### 6. Push

One push carries the rebase and the release commit together:

```bash
git push --force-with-lease origin <head-branch>
```

`--force-with-lease` refuses if the author pushed to the branch after the fetch in
step 4. In that case stop and report it; do not retry with `--force`.

The push runs whatever `pre-push` hook the repo has, so build and tests run on the
rebased code before anything lands on the base. If the hook fails, stop.

**From here to the merge, no questions and no pauses.** The review workflow waits 60
seconds after a push and skips the review if the PR is closed by then. Merging right
away keeps the push from triggering a review of the rebased branch.

### 7. Merge with squash commit

```
merge_pull_request(
  owner, repo,
  index=N,
  style="squash",
  title="<title> (#N)",
  delete_branch_after_merge=true
)
```

The title is the subject of the release commit from step 5, e.g.
`release 🐛: Releasing 3.0.104 so a slow cron run is not overlapped by the next tick (#128)`.
Without a release commit, use the PR title.

Passing `delete_branch_after_merge=true` lets Forgejo delete the remote branch server-side. Forgejo also closes the PR and — if the PR body contains `closes #N` — automatically closes the linked issue.

### 8. Clean up local branch

Switch to the base branch and delete the feature branch locally:

```bash
git checkout <base-branch>
git pull
git branch -D <head-branch>
```

Force-delete (`-D`) is used because the squash commit rewrites history and git won't consider the local branch "fully merged".

### 9. Notify

Invoke the `ntfy-me` skill with a message summarising what was merged:

> Merged PR #N: _\<title\>_ into `<base-branch>` on `<repo>`

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs when none is specified |
| `get_pull_request_by_index` | Read PR details (title, head, base, body) |
| `merge_pull_request` | Squash-merge the PR |

## Related skills

| Skill | Use case |
|-------|----------|
| `update-changelog` | Write the changelog entry for the new version |
