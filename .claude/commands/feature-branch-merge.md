---
name: feature-branch-merge
description: Squash-merge a feature branch into main, then delete the local branch and optionally the remote one
argument-hint: "[branch] [--remote] [-y]"
---

Squash-merge a feature branch into `main` with one commit message that covers every squashed commit, then delete the branch. The branch is the first argument, or the current branch when none is given.

Flags: `--remote` also deletes the remote branch without asking. `-y` skips the confirmation in step 5. The user reviews the commit afterwards and amends if needed.

1. Resolve the branch. Stop if it is `main` or `master`, if it does not exist, or if `git status --porcelain` shows uncommitted changes.
2. Switch to `main`. When it tracks a remote, run `git pull --ff-only` so the squash lands on the latest state. Stop if the pull is not a fast-forward.
3. Read what is being squashed: `git log main..<branch> --reverse` for the commits and `git diff --stat main...<branch>` for the change as a whole. Stop when the branch has no commits ahead of `main`.
4. Write the commit message following the commit format rules from the global rules, with `writing-clearly-and-concisely` for the prose. The subject states the motive and names the object, under about 72 characters. The body is a short paragraph or two of prose that covers every distinct change among the commits, so nobody has to open the branch to learn what it contained. Take the ticket from the branch name when it has one. No AI attribution.
5. Show the message in a code block together with the branch name and its tip SHA. Unless `-y` was passed, ask "Squash-merge and delete the branch?" and wait. Deleting is the part that cannot be undone without the SHA, so the confirmation sits here.
6. Run `git merge --squash <branch>`. On conflicts stop and report them: leave the working tree as it is and do not reset. Name `git reset --hard` as the way back to a clean `main`, and say the branch is untouched.
7. Run `git commit` with the message from step 4.
8. Delete the local branch with `git branch -D <branch>`. A squash leaves the branch unmerged into `main` in git's eyes. `-d` then either refuses (branch never pushed) or deletes with a warning (branch already merged into its upstream), so only `-D` behaves the same every time. The content is in the new commit.
9. If `git ls-remote --exit-code --heads origin <branch>` finds the branch on the remote, delete it with `git push origin --delete <branch>` when `--remote` was passed, otherwise ask first. Skip silently when there is no remote branch.
10. Show `git log -1 --oneline` and say that `main` is not pushed. If the local branch was deleted, name the SHA so it can be restored with `git branch <branch> <sha>`.
