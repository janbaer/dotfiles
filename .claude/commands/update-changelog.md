---
name: update-changelog
description: Update the changelog file with recent changes
argument-hint: [version-number]
---

Updating the file `CHANGELOG.md` in the current working directory with recent changes. Check for this the new commits in the feature branch and summarize the changes from all commits. If the feature-branch name contains a ticket number in the format VERBU-12345 add this at the beginning of the text for the changes.

The new entry be added at the beginning of the changes list in the following format

## version_number - date (format YYYY-MM-DD)
---

- {optional the ticket number}: changes...

When no version number is given, only add the date at the beginning.
