---
name: update-changelog
description: Update the changelog file with recent changes
argument-hint: [version-number]
---

Updating the file `CHANGELOG.md` in the current working directory with recent changes. Check for this the new commits since the last changelog entry and summarize the changes. Also run `git diff --staged` to include any staged but not yet committed changes in the summary. If the feature-branch name contains a ticket number in the format VERBU-12345 add this at the beginning of the text for the changes.

## Format detection

Before writing anything, read the existing `CHANGELOG.md` and study how existing entries are formatted. Use that exact format for the new entry — heading style, separator lines, spacing, whether ticket numbers use a colon or not, etc.

Only fall back to the default format below if the file does not exist or contains no entries yet.

## Default format (new changelogs only)

## version_number - date (format YYYY-MM-DD)

- {optional ticket number} changes...

When no version number is given, only add the date at the beginning.
