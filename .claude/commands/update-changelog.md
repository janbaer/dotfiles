---
name: update-changelog
description: Update the changelog file with recent changes
argument-hint: [version-number]
---

Update `CHANGELOG.md` in the current working directory. Check new commits since the last changelog entry and also run `git diff --staged` to catch any staged but uncommitted changes. If the branch name contains a ticket number in the format VERBU-12345, prefix the entry with it.

## What to write

Changelog entries answer **why** a change was made, not what or how. The diff already shows what changed — the changelog is for the reader who wants to understand the motivation.

Good: "Replaced the auth library after it was deprecated upstream"
Bad: "Updated auth.ts to use new library API, changed 3 function calls"

If the reason behind a change is not evident from the commit message or diff context, **ask** before writing anything for that commit.

## What to skip

Not every commit warrants a changelog entry. Ask whether to include a change when it's:
- A small mechanical change (whitespace, minor formatting, comment-only edits)
- A trivial config tweak with no user-visible effect
- A dependency bump with no clear security or feature motivation

When in doubt, ask.

## Format detection

Before writing, read the existing `CHANGELOG.md` and match the format of existing entries exactly — heading style, separator lines, spacing, ticket number syntax.

Only fall back to the default format below if the file doesn't exist or has no entries yet.

## Default format (new changelogs only)

## version_number - date (format YYYY-MM-DD)

- {optional ticket number} changes...

When no version number is given, only add the date at the beginning.
