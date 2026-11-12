# Obsidian formatting

## Contents

- Internal Links (Wikilinks)
- Embeds
- Callouts
- Properties (Frontmatter)
- Comments and Highlights
- Visualizations

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

### Visualizations

When the user asks for a visualization, diagram, or chart in an Obsidian note, **always use Mermaid** — it is built into Obsidian and requires no plugin.

```markdown
```mermaid
flowchart TD
    A["Node A"] --> B["Node B"]
```
```

**Important:** Use `<br/>` for line breaks inside node labels — `\n` is rendered literally and does not produce a line break:

```
✅  A["First line<br/>Second line"]
❌  A["First line\nSecond line"]
```

Supported Mermaid diagram types (all work natively in Obsidian):

| Type | Syntax | Use case |
|---|---|---|
| Flowchart | `flowchart TD` / `LR` | Processes, dependencies, decision trees |
| Sequence | `sequenceDiagram` | Communication between systems/services |
| Gantt | `gantt` | Schedules, project planning |
| Class | `classDiagram` | Data models, OOP structures |
| State | `stateDiagram-v2` | State machines, lifecycle diagrams |
| Pie | `pie` | Simple shares/distributions |
| Git | `gitGraph` | Branch strategies |
| ER | `erDiagram` | Database schemas |

**Other visualization options (require plugins):**

- **Excalidraw** (`obsidian-excalidraw-plugin`) — Hand-drawn style, free drawing canvas, popular for architecture
- **Dataview** (`dataview`) — Query tables and lists from vault metadata (not a chart, but structured data)
- **Charts** (`obsidian-charts`) — Bar, line and pie charts via YAML block
- **PlantUML** (`plantuml`) — Alternative to Mermaid for UML

