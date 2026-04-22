---
name: commit
description: Create a commit for the currently staged changes
---

Create a commit for the currently staged changes. Follow these steps:

1. Check the git remote: run `git remote get-url origin`. If the URL points to `gitlab.com` (host match, so `https://gitlab.com/...` or `git@gitlab.com:...`), stop immediately. Do not stage, diff, or commit anything. Tell the user:

   > This repository's origin is on gitlab.com. Use `/gitlab-commit` instead — it enforces the GitLab commit format (mandatory Jira ticket, no emojis).

   Then exit without further action. If the origin is not on gitlab.com, say nothing about this check and proceed silently to step 2.
2. Run `git status` to see what files are staged
3. Run `git diff --staged` to see the actual changes that will be committed
4. Analyze the changes and create an appropriate commit message following the commit format rules (see global rules). Use the `writing-clearly-and-concisely` skill to make the message clear for later reading.
5. Show the generated message to the user in a code block and say: "Here's the proposed commit message. Do you want to continue?"
6. If the user wants to continue, run `git commit`
7. Confirm the commit was successful with `git status`

If there are no staged changes, inform the user that there's nothing to commit.
