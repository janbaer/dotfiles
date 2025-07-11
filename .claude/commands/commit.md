---
description: Create a commit for the currently staged changes
---

Create a commit for the currently staged changes. Follow these steps:

1. Run git status to see what files are staged
2. Run git diff --staged to see the actual changes that will be committed
3. Analyze the changes and create an appropriate commit message that:
   - Summarizes the nature of the changes
   - Start the commit messages with the name of the identified component that was changed, like nvim. But not add what kind of change it was, like `feat, fix, bug`
   - Is concise but descriptive
   - Never add comments like `Generated by Claude` or `Generated by Claude AI`
4. Show the generated message to the user and ask him, if he wants to make changes
5. If the user wants to make changes offer a UI dialog to edit the message
6. Create the commit with the final message
7. Confirm the commit was successful with git status

If there are no staged changes, inform the user that there's nothing to commit.
