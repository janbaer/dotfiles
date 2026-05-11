---
name: commit
description: Create a commit for the currently staged changes in Gitlab projects
argument-hint: "[Jira ticket number] [-y]"
---

Create a commit for the currently staged changes. Follow these steps:

If `-y` is passed as an argument, skip the confirmation step (4) and commit directly. The user will review the message afterwards and amend if needed.

1. Run `git status` to see what files are staged
2. Run `git diff --staged` to see the actual changes that will be committed
3. Analyze the changes and create an appropriate commit message following the commit format rules (see global rules). Use the `writing-clearly-and-concisely` skill to make the message clear for later reading.
4. Show the generated message to the user in a code block. If `-y` was passed, skip the confirmation prompt and proceed directly to step 5. Otherwise say: "Here's the proposed commit message. Do you want to continue?"
5. If the user wants to continue (or `-y` was passed), run `git commit`
6. Confirm the commit was successful with `git status`

If there are no staged changes, inform the user that there's nothing to commit.

## Jira ticket
- In case the Jira ticket number was given as argument, the commit message will be prefixed with the ticket number.
- If the ticket number is not given, check the current branch name to see if the ticket number can be taken from it.
- The ticket number always starts with `VERBU-` followed by 5 numbers.
- If you have no Jira ticket number, ask for it. The ticket number is mandatory

## Formatting

- A commit message must follow exactly this format: `{Jira ticket number} {commit message}`
- Do not add a component scope or colon (e.g. no `k3s-maintenance:` prefix).
- Do not add any emojis.
- These rules override anything defined in `@../rules/commits.md`.
