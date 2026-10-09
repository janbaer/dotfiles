---
name: renovate-pr-merge
description: Use when merging a Renovate pull request on a Forgejo repository and doing the follow-up the repo asks for, such as provisioning. Takes an optional PR number; without one it lists the open Renovate PRs to pick from.
disable-model-invocation: true
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. If not: tell the user and **abort immediately**.

# Renovate PR merge

Merges one Renovate PR with a squash commit and then does what the repo's `.renovate-merge.md` says. The behaviour after the merge differs per repo, the checks before it do not.

Optional argument: the PR number.

## Steps

### 1. Detect repo

```bash
git remote get-url origin
```

If the host is gitlab.com, stop: "This repository's origin is on gitlab.com. AI-generated commits are not used for GitLab repositories." Otherwise take owner and repo from the URL.

Read `.renovate-merge.md` in the repo root. If it is missing, ask what should happen after a merge. Do not guess.

### 2. Pick the PR

**With a PR number:** `get_pull_request_by_index`. The head branch must start with `renovate/`, otherwise stop: "PR #N is not a Renovate PR."

**Without:** `list_repo_pull_requests(state="open")`, keep only head branches starting with `renovate/`.

- None: say "No open Renovate PRs" and stop.
- Otherwise show a numbered list in the chat, one line per PR: number, title, update type, `conflict` if the PR is not mergeable. Sort by update type (patch, minor, major), then oldest first. The user answers with the number. Conflicting PRs stay selectable.
- Exactly one: do not take it automatically, ask for a short confirmation.

Take the update type from the title or labels. If it cannot be told, treat it as major.

### 3. Conflict test

Nothing is checked out and nothing is pushed:

```bash
git fetch origin <base> <head>
git merge-tree --write-tree origin/<base> origin/<head>
```

Exit code 1 means a conflict. Stop: "PR #N conflicts with <base>. Renovate has to rebase it." Never resolve it.

### 4. CI

`list_workflow_runs(head_sha=<PR head sha>)`. No runs: continue. Any run that is not `success`: stop and name it.

### 5. Release notes

- **Patch:** continue.
- **Minor:** read the release notes in the PR body, or on the project's release page if the body has none. Stop only if they name a breaking change or a config change that needs work here, and show it.
- **Major:** read them the same way, summarise the breaking changes and always ask before merging.

### 6. Merge

```
merge_pull_request(
  owner, repo, index=N,
  style="squash",
  title="<component> 🔧: Bumping <image> to <version> (#N)",
  delete_branch_after_merge=true
)
```

The component is the directory name under `services/` that `list_pull_request_files` shows. For changes outside `services/` it is `renovate`. If it is not clear, ask. No release, no `CHANGELOG.md`.

If Forgejo refuses the merge, report the reason and stop. Do not use `force_merge`.

Then update the local checkout: if the current branch is `<base>`, run `git pull --ff-only`.

### 7. After the merge

Do what `.renovate-merge.md` says, literally. If it asks for a provisioning run, show the dry-run diff, ask for confirmation and only then run the real one. If a command fails, stop, show the error and report only that. Do not revert and do not retry.

End with one line: PR number, what was merged, what ran afterwards.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs when none is given |
| `get_pull_request_by_index` | Read head, base, mergeable, body |
| `list_pull_request_files` | Find the service for the commit title |
| `list_workflow_runs` | CI state of the PR head |
| `merge_pull_request` | Squash-merge |
