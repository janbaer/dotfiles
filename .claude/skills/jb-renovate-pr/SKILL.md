---
name: renovate-pr
description: Use when working through Renovate PRs on a Forgejo repository: list the open ones, pick one, merge it and do the follow-up the repo asks for, such as a backup and a provisioning run. Takes an optional PR number; without one it lists the open Renovate PRs to pick from.
disable-model-invocation: true
---

## Pre-requisites

- forgejo-mcp server must be available and successfully connected. If not: tell the user and **abort immediately**.

# Renovate PR

Takes one Renovate PR through the checks, merges it with a squash commit and then does what the repo's `.renovate-merge.md` says. The checks in steps 3 to 5 are the same everywhere. What happens before and after the merge differs per repo and lives in that file. The conversation with Jan is in German.

Optional argument: the PR number.

## Steps

### 1. Detect repo

```bash
git remote get-url origin
```

If the host is gitlab.com, stop: "This repository's origin is on gitlab.com. AI-generated commits are not used for GitLab repositories." Otherwise take owner and repo from the URL.

Read `.renovate-merge.md` in the repo root. If it is missing, ask what should happen before and after a merge. Do not guess. The file may add to the checks below, make them stricter, or replace the merge with another outcome. It may not skip a check.

### 2. Pick the PR

**With a PR number:** `get_pull_request_by_index`. The head branch must start with `renovate/`, otherwise stop: "PR #N is not a Renovate PR."

**Without:** `list_repo_pull_requests(state="open")`, keep only head branches starting with `renovate/`. If the file asks for it, add the entries under "Pending Approval" from the Dependency Dashboard issue. They have no PR yet.

PR bodies carry release notes and can be large, so the result may land in a file. Read only what the list needs from it with a short Python snippet.

- None: say that there are no open Renovate PRs and stop.
- Otherwise show one Markdown table with the columns `#`, `Paket`, `Änderung`, `Typ`, `Status`:
  - `Paket` and `Änderung` come from the update table in the PR body (`old` → `new`), not from the title. A grouped PR shows the number of packages in `Änderung` and the highest type in `Typ`.
  - `Typ` is Patch, Minor or Major. If it cannot be told, show Major.
  - `Status` is `Konflikt` if the PR is not mergeable, otherwise `ok`. A dashboard entry shows `Dashboard`.
  - Sort by type (Patch, Minor, Major), then oldest first.
- The user answers with the number. Conflicting PRs stay selectable.
- Exactly one: do not take it automatically, ask for a short confirmation.

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

### 6. Before the merge

Do what the `Before merge` section of the file says, literally. If it ends with a verdict other than "merge", follow that and stop here.

### 7. Merge

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

### 8. After the merge

Do what the `After merge` section of the file says, literally. If a command asks for a confirmation first, ask. If a command fails and the file names no recovery, stop, show the error and do not retry.

End with one line: PR number, what was merged, what ran afterwards.

## MCP Tools Reference

| Tool | Use case |
|------|----------|
| `list_repo_pull_requests` | List open PRs when none is given |
| `get_pull_request_by_index` | Read head, base, mergeable, body |
| `list_pull_request_files` | Find the service for the commit title |
| `list_workflow_runs` | CI state of the PR head |
| `merge_pull_request` | Squash-merge |
