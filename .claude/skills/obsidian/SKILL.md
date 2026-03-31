---
name: obsidian
description: Use when searching, reading, creating, or editing notes in the user's Obsidian vault — a directory tree of Markdown files used as a personal knowledge base. Trigger on phrases like "search Obsidian", "check Obsidian", "add to Obsidian", "update the Obsidian note", "what do I have on...", "save this to my notes", or when the user references an existing Obsidian file by name. Also trigger when the user wants to look something up in their personal notes or store new knowledge for later reference.
---

# Obsidian Vault

Manage the user's Obsidian vault via the Obsidian CLI, which communicates with a running Obsidian instance.

## Pre-requisites

Check that the Obsidian CLI is available and Obsidian is running:

```bash
obsidian help
```

If the command fails → inform the user that the Obsidian CLI is not available or Obsidian is not running, and abort.

## Vault Selection

All CLI commands require a `vault` parameter. The default vault name is **`Obsidian`**.

If the user specifies a vault name (e.g. "search my vault Notes for…"), use that name. Otherwise use the default:

```bash
obsidian vault="Obsidian" operation ...
```

## Tools

| Operation | Tool |
|-----------|------|
| Search content / filename | `obsidian vault="..." search query="..."` |
| Search by tag | `obsidian vault="..." tag name="TagName"` |
| List all tags with counts | `obsidian vault="..." tags sort=count counts` |
| Read a note | `obsidian vault="..." read file="Note Name"` |
| Create a new note | `obsidian vault="..." create name="..." template="page"` |
| Write note content | `obsidian vault="..." append file="..." content="..."` |
| Set note properties | `obsidian vault="..." property:set name="..." value="..." file="..."` |
| Find backlinks | `obsidian vault="..." backlinks file="Note Name"` |
| Precise edits (e.g. References section) | Edit tool (CLI has no line-targeted editing) |

Use Glob as a fallback for filename-pattern searches where CLI search isn't precise enough.

## Operations

### Search

When the user wants to find information in their vault:

1. **By topic/keyword**:
   ```bash
   obsidian vault="Obsidian" search query="search term" limit=10
   ```
2. **By tag** (case-sensitive):
   ```bash
   obsidian vault="Obsidian" tag name="TagName"
   ```
3. **List all tags**:
   ```bash
   obsidian vault="Obsidian" tags sort=count counts
   ```

Present results as a concise list. If multiple matches exist, show the most relevant ones and offer to dig deeper.

### Read

```bash
obsidian vault="Obsidian" read file="Note Name"
```

Summarize key points for the user unless they asked for the raw content.

### Create

When the user wants to add a new note:

1. **Check for existing notes first** — search for notes on the same topic:
   ```bash
   obsidian vault="Obsidian" search query="topic keywords" limit=5
   ```
   If a matching note exists, show it to the user and offer to update it instead. Only proceed with creation if no relevant note exists or the user explicitly wants a separate note.

2. **Determine placement** — search for notes in related topic areas to infer the vault's directory structure:
   ```bash
   obsidian vault="Obsidian" search query="related topic" limit=10
   ```
   Suggest the placement as a relative path (e.g. `Linux/Tools`, `DevOPs/Docker`) based on the results, and ask the user to confirm or change it.

3. **Create with template and set properties** — suggest 3–5 relevant tags based on the note's topic and content, then create the note and set its properties:
   ```bash
   obsidian vault="Obsidian" create name="note-name" template="page" silent
   obsidian vault="Obsidian" property:set name="created" value="YYYY-MM-DD" file="note-name"
   obsidian vault="Obsidian" property:set name="tags" value="[tag1,tag2,tag3]" file="note-name"
   ```
   Use today's date. Tags should be lowercase, hyphenated, and specific enough to be useful for cross-referencing (e.g. `git`, `shell-scripting`, `docker-compose`).

4. **Write content** — append the note body after template creation:
   ```bash
   obsidian vault="Obsidian" append file="note-name" content="..."
   ```
   The filename should be descriptive with words separated by hyphens (no spaces), e.g. `docker-compose.md`, `rust-error-handling.md`.

5. **Find cross-reference candidates** — search for notes sharing the same tags or subject:
   ```bash
   obsidian vault="Obsidian" tag name="TagName"
   obsidian vault="Obsidian" backlinks file="note-name"
   ```
   Present the candidates to the user and ask which files should reference the new note. For each file the user selects, read it with `obsidian vault="..." read`, then add a `## References` section at the bottom using the Edit tool (if one doesn't already exist):
   ```markdown
   ## References

   - [[new-note-name]]
   ```
   If a `## References` section already exists, append the link there instead of creating a duplicate section.

6. **Confirm** — report the file path, tags applied, and a one-line summary of what was created.

### Update

When the user wants to modify an existing note:

1. **Read first**:
   ```bash
   obsidian vault="Obsidian" read file="Note Name"
   ```
2. **Append a new section** (preferred):
   ```bash
   obsidian vault="Obsidian" append file="Note Name" content="\n## New Section\n\ncontent here"
   ```
3. **Set a property**:
   ```bash
   obsidian vault="Obsidian" property:set name="status" value="updated" file="Note Name"
   ```

Use the Edit tool only when surgical line-level changes are needed (e.g. inserting into an existing References section).

Summarize what changed after editing.

### Backlinks

When the user asks "what references this note?" or "where is this concept used?":

```bash
obsidian vault="Obsidian" backlinks file="Note Name"
```

Present the results as a list of linking notes with a brief description of each.

## Vault Structure

The vault is organized by topic directories at the root level. Each directory contains Markdown files related to that topic. Respect this structure when creating or suggesting placement for new notes.

## Obsidian Formatting

Standard Markdown is assumed. Use these Obsidian-specific extensions when writing note content.

### Internal Links (Wikilinks)

Always use wikilinks for vault-internal references; use `[text](url)` only for external URLs.

```markdown
[[Note Name]]                    Link to note
[[Note Name|Display Text]]       Custom display text
[[Note Name#Heading]]            Link to specific heading
[[Note Name#^block-id]]          Link to specific block
[[#Heading in same note]]        Same-note heading link
```

Define a block ID by appending `^block-id` to a paragraph (or on a separate line after a list/quote block).

### Embeds

Prefix any wikilink with `!` to embed content inline:

```markdown
![[Note Name]]                   Embed full note
![[Note Name#Heading]]           Embed section
![[image.png]]                   Embed image
![[image.png|300]]               Embed image with fixed width
![[document.pdf#page=3]]         Embed PDF page
```

### Callouts

```markdown
> [!note]
> Basic callout.

> [!warning] Custom Title
> Callout with a custom title.

> [!faq]- Collapsed by default
> Foldable callout (- collapsed, + expanded).
```

Common types: `note`, `tip`, `info`, `warning`, `danger`, `success`, `failure`, `question`, `example`, `quote`, `bug`, `abstract`, `todo`.

### Properties (Frontmatter)

```yaml
---
title: My Note
date: 2024-01-15
tags:
  - project
  - active
aliases:
  - Alternative Name
cssclasses:
  - custom-class
---
```

- `tags` — searchable labels; also usable inline as `#tag` or `#nested/tag`
- `aliases` — alternative note names surfaced in link suggestions
- `cssclasses` — CSS classes applied to the note in reading view
- Tags may contain letters, numbers (not first character), underscores, hyphens, and forward slashes

### Comments and Highlights

```markdown
This is visible %%but this is hidden%% text.

%%
This entire block is hidden in reading view.
%%

==Highlighted text==
```

## Guidelines

- Keep notes concise and well-structured with clear headings
- For internal links between notes, use `[[Note Name]]` wiki-link syntax
- When the user says "add to Obsidian" with some knowledge or information, distill it into a well-organized note rather than dumping raw text
