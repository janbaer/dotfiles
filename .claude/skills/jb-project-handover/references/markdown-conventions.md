# Markdown conventions

The pages are plain Markdown in `docs/handover/`, one file per page. `scripts/build.ts` turns them into `docs/handover/_site/`. It reads only the top level of the folder, so `docs/handover/_workspace/` stays out of the package. `index.md` is required.

```
bun <skill dir>/scripts/build.ts docs/handover            # build, check links, exit 1 on a broken link (the folder is optional: ./docs/handover, else .)
bun <skill dir>/scripts/build.ts docs/handover --allow-missing   # unfinished sets: links to missing pages are ignored
bun <skill dir>/scripts/build.ts --selftest      # run after a Bun update
```

Tested with Bun 1.3.14, self-test passes on 1.4.2. `Bun.markdown` is marked unstable upstream, so the self-test is the safeguard.

## Front matter

```
---
title: Runbooks            # browser title
nav: Runbooks              # label in the navigation (default: title)
order: 3                   # position in the navigation
layout: narrow             # optional, the default is the wide page
summary: One line shown in small type under the heading.
toc: true                  # optional, table of contents from the H2 headings
status: Draft — 2026-10-09 # index.md only: shown as the status line on every page
---
```

The status line text comes from `date`, never from memory.

## Elements

- **Callouts** start with a marker on the first line: `> [!note]`, `> [!warning]`, `> [!status]` (the status box on the start page; several paragraphs separated by `>`), `> [!source]` (a small source line under a table or section, one paragraph only).
- **Status chips** in text and table cells: `{verified}`, `{inferred}`, `{unverified}`, `{partial}`, `{owner}` for facts, `{high}`, `{medium}`, `{low}`, `{done}` for priorities. `{owner}` means stated by the owner in the interview and not checked against the code; it is not a role label for a people table. Only these chips exist: anything else (`{closed}`) is printed as plain text, so use `{done}` for closed points. A custom label: `{partial: Settings verified, advice is a proposal}`. Chips inside code spans and code blocks stay literal.
- **Cards** (start page): a fenced block, one card per line, `Title | target.md | text | label`. The label is optional and renders as a small uppercase mark above the title (a number, a reading time, "soon"). Use `-` as target for a card without link; it is drawn dashed. The text must not contain `|`.
- **Mermaid diagrams**: a plain fenced block named `mermaid`. GitLab and GitHub render it in the Markdown itself; the built site renders it in the browser and enlarges a diagram in a dialog on click (Esc or a click closes it). Any Mermaid type works (`graph`, `sequenceDiagram`, `stateDiagram-v2` and so on), so pick the one that fits the content; a flowchart is only the default choice. See "Mermaid look" below.
- **Tables:** GitHub style. Escape a pipe inside a cell as `\|`, also inside code. No merged cells; repeat the text or move it under the table.
- **Links:** between pages `other.md#heading-id`, rewritten to `.html`. Heading ids are made from the heading text in lower case with hyphens (`## Restore from a backup (draft)` is `#restore-from-a-backup-draft`). The build fails on a missing anchor.
- **External URLs:** write `[https://host](https://host)`. A URL in backticks stays plain code text and is not clickable.
- **Code blocks:** plain fenced blocks. Commands you want copied go in a block, not in a sentence.

## Lists instead of dense paragraphs

A paragraph that carries several claims is hard to scan and hides which chip belongs to which fact. Turn it into a list: one fact per item, one chip per item, the current state first, the history ("before, X") last. A source goes into the chip label: `{verified: \`terraform/nat-rules.tf\`}`.

Before:

```markdown
SSH goes through HAProxy since 2026-10-15 {verified}. The public address is translated to the VIP; before, it went straight to the jump host {verified}. HAProxy forwards the raw stream, so the login still happens on the jump host {inferred}.
```

After:

```markdown
SSH to the jump host goes through HAProxy since 2026-10-15 {verified}:

- Public address `46.30.5.58:44022` is translated to the VIP `10.2.201.101` {verified: `terraform/nat-rules.tf`}.
- HAProxy forwards the raw TCP stream, so key and TOTP login still happen on `bu-dev-ssh-01` {inferred}.
- Before, `46.30.5.57` was translated straight to `10.2.201.190` {verified}.
```

## Mermaid look

The default look (dark card, monospace, light lines, rounded edges) is `assets/mermaid-config.json`:

- `version`: Mermaid major version, loaded from the jsdelivr CDN when the page opens.
- `background`: colour of the card and the enlarged view.
- `mermaid`: passed unchanged to `mermaid.initialize` (theme, `themeVariables`, per-diagram-type options such as `flowchart.curve`).

To change the look for one package, put a `mermaid.json` with the same keys into the docs folder (`docs/handover/mermaid.json`); it replaces the default completely. To change a single diagram, start its block with a `%%{init: {...}}%%` directive. The `themeVariables` apply to every diagram type.

Mermaid needs a network at view time. Offline, the diagram source stays visible as a code block. The build itself still needs no network.

## What the build adds

Navigation from the files (sorted by `order`), the Draft line under every heading except on the start page, the page shell, the stylesheet and the Mermaid loader in `_site/assets/`. The build needs no network. Pages without a `mermaid` block load nothing from outside.
