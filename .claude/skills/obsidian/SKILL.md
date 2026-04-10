---
name: obsidian
description: Use when searching, reading, creating, or editing notes in the user's Obsidian vault — a directory tree of Markdown files used as a personal knowledge base. Trigger on phrases like "search Obsidian", "check Obsidian", "add to Obsidian", "update the Obsidian note", "what do I have on...", "save this to my notes", or when the user references an existing Obsidian file by name. Also trigger when the user wants to look something up in their personal notes or store new knowledge for later reference. Additionally handles wiki maintenance workflows: ingesting new sources, querying the wiki with write-back, and running lint/health-check passes.
---

# Obsidian Vault

Manage the user's Obsidian vault via the Obsidian CLI, which communicates with a running Obsidian instance.

## Pre-requisites

Check that the Obsidian CLI is available and Obsidian is running:

```bash
obsidian help
```

If the command fails → inform the user that the Obsidian CLI is not available or Obsidian is not running, and abort.

## Wiki Schema

At the start of every session that involves wiki operations (ingest, query, lint, or any structural changes), read the schema file:

```bash
obsidian vault="Obsidian" read file="CLAUDE"
```

If `CLAUDE.md` does not exist, inform the user that the wiki schema has not been defined yet and offer to create one. Do not perform wiki workflows without a schema — the schema defines page types, frontmatter standards, tag conventions, and linking rules that all operations depend on.

For simple note lookups or quick searches, reading the schema is not required.

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

---

## Wiki Workflows

These workflows implement the LLM Wiki pattern — they turn the vault from a flat collection of notes into a persistent, compounding knowledge base. All wiki workflows require the schema (`CLAUDE.md`) to be loaded first.

### Ingest

Use when the user provides a new source to integrate into the wiki. A source can be: a URL, a pasted article, an uploaded document, notes from a meeting or conversation, or any other raw knowledge.

**Workflow:**

1. **Read the schema** — load `CLAUDE.md` to know page types, frontmatter standards, tag conventions, and linking rules.

2. **Read the source** — understand the content fully before doing anything.

3. **Discuss with the user** — summarize 3-5 key takeaways from the source. Ask the user what to emphasize, what's most relevant, and whether anything should be skipped. Do not proceed silently — the user steers the analysis.

4. **Search for existing coverage** — before creating new pages, check what the wiki already knows about the topics in the source:
   ```bash
   obsidian vault="Obsidian" search query="key concept from source" limit=10
   ```
   Identify pages that need updating vs. topics that need new pages.

5. **Create a Source Summary page** — following the schema's Source Summary type. Include: title, author/origin, date, one-paragraph summary, key claims or insights, and links to the wiki pages it touches.

6. **Update existing pages** — for each topic already covered in the wiki, read the existing page, integrate new information from the source, and add a link back to the Source Summary. Update the `updated` frontmatter field.

7. **Create new pages** — for concepts or entities mentioned in the source that deserve their own page (per the schema's criteria), create them following the appropriate page type template.

8. **Cross-reference** — ensure all new and updated pages link to each other where relevant. Every Source Summary must link to the pages it informed, and those pages must link back.

9. **Update index** — read `index.md`, add entries for any new pages, update summaries for modified pages:
   ```bash
   obsidian vault="Obsidian" read file="index"
   ```

10. **Append to log** — add a timestamped entry to `log.md`:
    ```bash
    obsidian vault="Obsidian" append file="log" content="\n## [YYYY-MM-DD] ingest | Source Title\n\nSummary of what was added/updated. Pages touched: [[Page1]], [[Page2]], [[Page3]].\n"
    ```

11. **Report** — tell the user what was created and updated, with links to all affected pages.

**Guidelines:**
- A single source typically touches 5-15 pages. If you're only creating one page, you're probably not cross-referencing enough.
- Prefer updating existing pages over creating new ones. Only create a new page when the topic genuinely doesn't have one yet.
- Flag contradictions explicitly — if the new source says something different from what an existing page claims, note the contradiction on the affected page rather than silently overwriting.
- The user should be able to follow the trail from any wiki page back to the raw sources that informed it.

### Query

Use when the user asks a question that should be answered from the wiki's accumulated knowledge, or when the user says things like "what does the wiki say about...", "summarize what we know about...", or "based on my notes...".

**Workflow:**

1. **Read the schema** — load `CLAUDE.md`.

2. **Find relevant pages** — start with the index if available, then search:
   ```bash
   obsidian vault="Obsidian" read file="index"
   obsidian vault="Obsidian" search query="query keywords" limit=10
   ```

3. **Read the relevant pages** — read the top matches to build a comprehensive understanding. Follow wiki-links to adjacent pages if they seem relevant. Typically 3-8 pages are needed for a good answer.

4. **Synthesize an answer** — answer the question using wiki content. Use `[[wiki-links]]` as inline citations so the user can click through to the source pages. Be specific — reference which pages contributed which information.

5. **Offer write-back** — if the answer is substantive (a comparison, an analysis, a synthesis that connects multiple pages), ask the user:
   > "This could be valuable as a wiki page. Should I save it as [[Suggested Page Name]]?"

   If the user agrees:
   - Create the page following the schema's conventions
   - Set `type` in frontmatter to the appropriate page type (often a Concept or a new analysis type)
   - Add cross-references to all pages that were consulted
   - Update `index.md` and append to `log.md`

**Guidelines:**
- Prefer wiki content over your own training knowledge. The wiki is the source of truth for this user's domain.
- If the wiki doesn't cover the topic, say so clearly and offer to start building coverage (via ingest).
- Don't just dump page contents — synthesize across pages and highlight connections.

### Lint

Use when the user asks for a wiki health-check, maintenance pass, or says things like "clean up the wiki", "check for problems", "run a lint". Also suggest a lint pass proactively after a large batch of ingests.

**Workflow:**

1. **Read the schema** — load `CLAUDE.md` to know what "healthy" looks like.

2. **Check orphan pages** — find notes with no inbound links:
   For each note in the vault, check backlinks:
   ```bash
   obsidian vault="Obsidian" backlinks file="Note Name"
   ```
   Notes with zero backlinks (except index.md, log.md, and CLAUDE.md) are orphans.

3. **Check frontmatter completeness** — scan for notes missing required fields defined in the schema (type, tags, created, etc.):
   ```bash
   obsidian vault="Obsidian" search query="keyword" limit=20
   ```
   Read a sample of pages and check their frontmatter against the schema's requirements.

4. **Check tag consistency** — list all tags and look for violations of the schema's tag conventions:
   ```bash
   obsidian vault="Obsidian" tags sort=count counts
   ```
   Flag: wrong casing, typos, tags not in the canonical list, duplicate/overlapping tags.

5. **Find missing pages** — search for wiki-links that point to non-existent pages (broken links). Also identify concepts mentioned in 3+ pages that don't have their own page yet.

6. **Check for stale content** — find pages where `updated` is significantly older than related pages, suggesting they may have been superseded.

7. **Report findings** — present a prioritized list of issues to the user, grouped by severity:
   - **Critical**: broken links, contradictions, incorrect information
   - **Important**: orphan pages, missing frontmatter, tag inconsistencies
   - **Nice to have**: missing pages for frequently-mentioned concepts, stale content

8. **Fix with permission** — for each category of issues, ask the user whether to fix them now. Apply fixes following the schema conventions. Do not bulk-fix without confirmation.

9. **Append to log**:
   ```bash
   obsidian vault="Obsidian" append file="log" content="\n## [YYYY-MM-DD] lint | Maintenance pass\n\nFindings: X orphans, Y missing frontmatter, Z tag issues. Fixed: [list of fixes applied].\n"
   ```

**Guidelines:**
- Lint is non-destructive by default — report first, fix only with user permission.
- For large vaults, sample rather than exhaustively scanning every page. Focus on the most-linked and most recently modified pages first.
- Suggest new questions to investigate or new sources to look for based on gaps you discover.

---

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
- When performing wiki workflows (ingest, query, lint), always read `CLAUDE.md` first and follow its conventions
- Prefer updating existing pages over creating duplicates
- Every page should have at least one inbound link — no orphans
- Flag contradictions between pages rather than silently overwriting
