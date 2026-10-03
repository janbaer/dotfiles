---
name: forgejo-pr-merge
model: haiku
description: Use when merging (closing) a Pull Request on a Forgejo repository via squash commit. Trigger on phrases like "merge this PR", "merge a PR", "close this PR", "close the PR", "merge PR #N", "squash and merge", or "land this PR". Always use this skill when the user wants to merge or close a PR — even if they don't explicitly say "squash".
disable-model-invocation: true
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. Verify by checking that forgejo-mcp tools are listed. If not available: inform the user that the forgejo-mcp MCP server is not connected, and **abort immediately**.

# Forgejo PR Merge

Merges a Pull Request using a squash commit, cleans up the branch locally and then
releases it with the **forgejo-release** skill: version bump and changelog entry on
`main`, pushed after the merge. The release is skipped with `no-release`, so several PRs
can land before one deploy.

Optional arguments: the PR number, `patch` (default), `minor` or `major` for the bump,
and `no-release`.

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

### 4. Test the PR on top of the base

Other PRs may have landed on the base since this branch was created. A local rebase
puts the branch on top of them, so the tests run on the code that will actually land.
The rebased branch is **never pushed**: a push changes the PR head, the approval goes
stale and Forgejo refuses the merge, and the review workflow starts another round.

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
# any output → stop: "The local <head-branch> has commits that are not on origin. Push them and wait for the review, or drop them, then merge again."
git switch <head-branch>
git reset --hard origin/<head-branch>
git rebase origin/<base-branch>
```

The reset aligns a stale local copy with the PR as it was reviewed. When the branch does
not exist locally, `git switch` creates it from origin and the `git log` check prints nothing.

**On a conflict, never resolve it.** Run `git rebase --abort`, switch back to the base
branch and stop: "PR #N conflicts with <base>. Rebase it on the branch, then merge again."
The conflict goes back to whoever wrote the PR.

```bash
git rev-parse HEAD origin/<head-branch>
# same SHA → the rebase changed nothing, skip the tests
```

Otherwise take the test command from the project: its `CLAUDE.md`, or the `test` script
in `package.json` (for howcani: `bun test --isolate`). If they fail, switch back to the
base branch and stop: "PR #N fails its tests after rebasing onto <base>." No merge.

Whenever this step stops, also run `git branch -D <head-branch>` after switching back.
The local branch only holds the throwaway rebase, and the check above would otherwise
trip over it on the next run.

A project without tests is fine: skip this step and mention it in the final summary.

### 5. Check the approval is still current

```
list_pull_reviews(owner, repo, index=N)
```

The latest review by `ai` must be `APPROVED` and not `stale`. Anything else means the
branch moved after the approval: stop and say which review is in the way. Do not push,
comment or retry the merge to get past it.

### 6. Merge with squash commit

```
merge_pull_request(
  owner, repo,
  index=N,
  style="squash",
  title="<title> (#N)",
  delete_branch_after_merge=true
)
```

The title is the PR title.

Passing `delete_branch_after_merge=true` lets Forgejo delete the remote branch server-side. Forgejo also closes the PR and — if the PR body contains `closes #N` — automatically closes the linked issue.

### 7. Clean up local branch

Switch to the base branch and delete the feature branch locally:

```bash
git checkout <base-branch>
git pull
git branch -D <head-branch>
```

Force-delete (`-D`) is used because the squash commit rewrites history and git won't consider the local branch "fully merged".

### 8. Notify

Invoke the `ntfy-me` skill with a message summarising what was merged:

> Merged PR #N: _\<title\>_ into `<base-branch>` on `<repo>`

### 9. Release

Only when the base branch is `main` or `master` and both `scripts/bump-version.ts` and
`CHANGELOG.md` exist. Invoke the **forgejo-release** skill with the bump type
(`patch` unless the user said otherwise). It releases everything merged since the last
release, so a PR merged earlier with `no-release` goes out with this one.

With `no-release`, skip this and end with one line that the change is merged but not
released, and that `/forgejo-release` deploys it.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs when none is specified |
| `get_pull_request_by_index` | Read PR details (title, head, base, body) |
| `list_pull_reviews` | Check the approval is not stale |
| `merge_pull_request` | Squash-merge the PR |

## Related skills

| Skill | Use case |
|-------|----------|
| `forgejo-release` | Bump the version, write the changelog and push the release to `main` |
