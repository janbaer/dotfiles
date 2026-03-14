---
name: obsidian
description: Use when searching, reading, creating, or editing notes in the user's Obsidian vault — a directory tree of Markdown files used as a personal knowledge base. Trigger on phrases like "search Obsidian", "check Obsidian", "add to Obsidian", "update the Obsidian note", "what do I have on...", "save this to my notes", or when the user references an existing Obsidian file by name. Also trigger when the user wants to look something up in their personal notes or store new knowledge for later reference.
---

# Obsidian Vault

Manage the user's Obsidian vault — a directory of Markdown files serving as a personal knowledge base.

## Pre-requisites

The vault path comes from the `OBSIDIAN_VAULT` environment variable. Check it at the start:

```bash
echo $OBSIDIAN_VAULT
```

If the variable is empty or unset, ask the user for the vault path before proceeding.

## Tools

Use standard file tools — no MCP server needed since Obsidian vaults are just directories of Markdown files:

| Operation | Tool |
|-----------|------|
| Find files by name/pattern | Glob |
| Search content across notes | Grep |
| Read a note | Read |
| Edit an existing note | Edit |
| Create a new note | Write |
| List directories | Bash (`ls`) |

## Operations

### Search

When the user wants to find information in their vault:

1. **By topic/keyword** — use Grep to search content across the vault:
   ```
   Grep(pattern="search term", path="$OBSIDIAN_VAULT")
   ```
2. **By filename** — use Glob to find notes:
   ```
   Glob(pattern="**/*keyword*", path="$OBSIDIAN_VAULT")
   ```
3. **Browse a directory** — list files in a specific topic folder:
   ```
   Bash: ls "$OBSIDIAN_VAULT/TopicName/"
   ```

Present results as a concise list. If multiple matches exist, show the most relevant ones and offer to dig deeper.

### Read

Read the full note with the Read tool. Summarize key points for the user unless they asked for the raw content.

### Create

When the user wants to add a new note:

1. **Check for existing notes first** — before creating anything, search the vault for notes on the same topic using both Glob (filename) and Grep (content). If a matching note exists, show it to the user and offer to update it with the new information instead of creating a duplicate. Only proceed with creation if no relevant note exists or the user explicitly wants a separate note.

2. **Determine placement** — list existing top-level directories with Glob and suggest the one that best fits the note's topic. Present the suggestion as a relative path from the vault root (e.g. `Linux/Tools`, `DevOPs/Docker`) and ask the user to confirm or change it. If the chosen directory does not exist yet, create it with `mkdir -p` before writing the file.

3. **Apply template** — new pages use `_templates/page.md` as the base. The frontmatter format is:
   ```yaml
   ---
   created: YYYY-MM-DD
   tags: []
   ---
   ```
   Replace `YYYY-MM-DD` with today's date. Populate tags based on the content topic.

4. **Write the note** — use the Write tool. The filename should be descriptive and use Title Case with spaces (Obsidian convention), e.g. `Docker Compose.md`, `Rust Error Handling.md`.

5. **Confirm** — tell the user the file path and a one-line summary of what was created.

### Update

When discussing an existing note and the user wants to modify it:

1. **Read first** — always read the current content before editing.
2. **Edit** — use the Edit tool for targeted changes (adding sections, updating content, adding tags).
3. **Confirm** — summarize what changed.

When adding new information to an existing note, append it as a new section rather than rewriting the entire file, unless the user asks for a restructure.

## Vault Structure

The vault is organized by topic directories at the root level. Each directory contains Markdown files related to that topic. Respect this structure when creating or suggesting placement for new notes.

## Guidelines

- Keep notes concise and well-structured with clear headings
- Use Markdown features: headers, lists, code blocks, links
- For internal links between notes, use Obsidian's `[[Note Name]]` wiki-link syntax
- When the user says "add to Obsidian" with some knowledge or information, distill it into a well-organized note rather than dumping raw text
