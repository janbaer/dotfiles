---
name: cheatsheet-import
model: sonnet
description: >
  Imports cheat sheet files (JPG, PNG, GIF, PDF) into the Obsidian wiki as one page
  per sheet under Cheatsheets/<topic>/, with a description, search keywords, the
  embedded artifact and links from the matching hub page. Handles renaming, duplicate
  detection and source cleanup. Use whenever the user wants to import, file or sort
  cheat sheets into Obsidian — triggered by phrases like "import these cheatsheets",
  "sortiere die Cheat-Sheets ein", "add these cheat sheets to the wiki", or when a
  folder of cheat sheet images is handed over for filing.
disable-model-invocation: true
---

# Cheat Sheet Import

One cheat sheet = one page. The page carries the text that makes the sheet findable,
because Obsidian search cannot look inside an image.

Target layout:

```
Cheatsheets/
  Cheatsheets.md              hub, grouped by topic
  <topic>/<slug>.md           one page per sheet
  <topic>/files/<slug>.<ext>  the artifact itself
```

Existing topics: `k8s`, `docker`, `terraform`, `linux`, `networking`, `cloud`, `git`,
`devops`, `security`, `observability`, `python`, `rust`, `coding`, `databases`, `ai`.
Add a new one only when at least two sheets need it, otherwise use the closest existing
topic. A new topic whose tag is not in the vault's canonical list needs that tag added
to `Obsidian/CLAUDE.md` and a line in the log.

---

## Phase 1 — Inventory and duplicate check

The source directory defaults to `/mnt/zb-02-data/hermes-agent/data/images/cheat-sheets`.
Use another one only when the user names it. List it and compare checksums against
everything already filed:

```bash
md5sum "$SRC"/* | sort
find ~/Documents/Obsidian -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.gif" \
  -o -iname "*.png" -o -iname "*.pdf" \) -exec md5sum {} \; | sort
```

Identical checksums mean the sheet is already in the vault: skip it, do not file it twice.
Different bytes do **not** prove different content, so Phase 2 still has to look.

## Phase 2 — Inspect the sheets

**PDFs first.** The Read tool cannot rasterise a PDF and there is no poppler on PATH.
Render the first pages to JPG before any inspection, otherwise the description ends up
guessed from the filename:

```bash
# both must be exported: the nested `bash -c` is a separate process and the
# single-quoted script is expanded there, not in this shell
export SRC=/mnt/zb-02-data/hermes-agent/data/images/cheat-sheets
export OUT=$(mktemp -d)

nix shell nixpkgs#poppler-utils --command bash -c '
  for f in "$SRC"/*.pdf; do
    b=$(basename "$f" .pdf); safe=$(echo "$b" | tr " ()&" "____")
    pages=$(pdfinfo "$f" | awk "/^Pages:/{print \$2}")
    pdftoppm -jpeg -r 120 -f 1 -l $(( pages < 2 ? pages : 2 )) "$f" "$OUT/$safe"
    echo "$b|pages=$pages|prefix=$safe"
  done'

echo "rendered pages are in $OUT"   # hand this path to the inspecting subagent
```

Keep the page count: it separates a real cheat sheet from a handbook that happens to sit
in the same folder, and the page count belongs in the description.

Delegate the viewing to a subagent (`Explore`) so the images stay out of the main
context. Give it the rendered-file mapping. Split the batch across two parallel agents
when there are more than ~20 files. Ask it to return, per file, a compact entry and
nothing else:

- filename
- one sentence describing what the sheet actually shows
- topic category from the list above
- suggested kebab-case slug
- 3 to 5 concrete terms that appear on the sheet (these become the keywords)

Always ask the subagent to check explicitly for:

- **Format pairs** in the batch (`x.jpg` + `x.pdf`, `x.jpg` + `x.gif`) — same content or not,
  and which copy is the better one to keep. Keep the more complete artifact: the multi-page
  PDF over a single-page JPG of its cover, the static JPG over an animated GIF that adds
  only motion.
- **Topic overlap** with sheets already in the vault. Name the candidate page and ask whether
  the content matches in substance, not just in title.

## Phase 3 — Confirm the plan

Before anything moves, show the user a compact table: source file, topic, slug, and the
action (`import`, `skip (duplicate of X)`, `merge into existing page Y`). Files get deleted
at the end, so the user approves the mapping first.

Rules for the decisions:

- A sheet that duplicates a filed one in substance does **not** get a second page. Add it
  to the existing page as a second embed and say so in the description.
- A sheet that shares a subject but has a different structure or purpose is its own page,
  cross-linked to the related one.

## Phase 4 — Place the artifacts

The artifact filename matches the page slug, so page and file stay in step:

```bash
mkdir -p ~/Documents/Obsidian/Cheatsheets/<topic>/files
cp "$SRC/<original>" ~/Documents/Obsidian/Cheatsheets/<topic>/files/<slug>.<ext>
```

## Phase 5 — Write the pages

Get the date from `date +%F`, never from context. One page per sheet:

```markdown
---
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: reference
tags: [<topic tags>, reference]
status: active
---

# <Title in Title Case>

<Two or three sentences on what the sheet covers. Name the concrete sections, not
"a useful overview". Credit the author or source if the sheet names one.>

**Keywords:** <the concrete terms on the sheet, comma separated>

![[<slug>.<ext>]]

## References

- [[Cheatsheets]] — cheat sheet index
- [[<parent hub>]] — parent hub
- [[<related sheet>]] — <why it is related>
```

Tags per topic:

| Topic | Tags |
|---|---|
| k8s | `k8s, reference` |
| docker | `docker, container, reference` |
| terraform | `terraform, reference` |
| linux | `linux, reference` |
| git | `git, reference` |
| devops | `devops, troubleshooting, reference` |
| security | `security, ci-cd, reference` |
| observability | `monitoring, reference` |
| ai | `ai, devops, reference` |
| networking | `network, reference` |
| cloud | `cloud, reference` |
| python | `python, reference` |
| rust | `rust, reference` |
| coding | `coding, reference` |
| databases | `reference` plus the engine, e.g. `mongodb` |

Only canonical tags from the vault schema (`Obsidian/CLAUDE.md`). Set `status: draft`
when the content could not actually be verified, for example a PDF that would not render.

The description is the part that earns its keep. It is what Obsidian search matches on,
so it has to name the real content: `CrashLoopBackOff, ImagePullBackOff, OOMKilled`
beats "common Kubernetes problems".

For a batch of more than a handful, write the metadata into a `~`-separated table and
generate the pages instead of writing each file by hand:

```bash
# row: slug~topic~files~title~description~keywords~refs
STATUS_DRAFT="slug-that-could-not-be-verified" \
  assets/generate-pages.sh sheets.tsv ~/Documents/Obsidian/Cheatsheets
```

## Phase 6 — Link from the hub pages

A sheet nobody links to is still lost. Two places:

1. **The subject hub page** gets a `## Cheatsheets` section with a `[[slug]] — short
   description` line per sheet. Parent pages in use: [[k8s_overview]], [[Docker]],
   [[Terraform]], [[Git]], [[Partitions]], [[Prometheus]], [[AI-Tools]], [[Networks]].
   Never embed the image there again — that is the problem this layout replaced.
2. **`Cheatsheets.md`** gets the sheet in its topic section.

## Phase 7 — Wiki bookkeeping

- `Wiki-Maintenance/index.md`: individual sheet pages are **not** listed there, the hub
  covers them. Only fix entries whose path changed.
- `Wiki-Maintenance/log.md`: append an entry with what was imported, what was skipped and
  why, and anything left open.

## Phase 8 — Verify, then delete the source

Run the check over the cheat sheet pages plus every hub page the import touched:

```bash
V=~/Documents/Obsidian
assets/verify.py --vault "$V" "$V/DevOPs/k8s/k8s_overview.md" "$V/DevOPs/Docker/Docker.md"
```

It reports broken embeds, unresolved wikilinks, cheat sheet files that no page embeds,
and (as a warning) note names that exist twice. It exits non-zero on the first three.
Fix what it finds.

Delete the source files **only after** verification passes, and only if the user asked for
it. Report skipped duplicates explicitly — deleting a file that was never filed needs to be
a visible decision, not a silent one.

---

## Notes

- Obsidian resolves `[[wikilinks]]` by note name, so moving a page does not break links to
  it. Only path annotations in `index.md` need fixing.
- Renaming an **artifact** is different: it breaks every page that linked the old filename
  or used a path like `[[Cheatsheets/files/x.pdf]]`, and those pages are usually nowhere
  near the import. `verify.py` checks this vault-wide. Point the broken link at the new
  cheat sheet page rather than at the raw file.
- A keyword or description containing `[[` is parsed as a wikilink. `df.iloc[[0],[0]]`
  silently becomes a link to a note called `0`. Wrap such terms in backticks.
- Name the section on a hub page exactly `## Cheatsheets`. A page that already has
  `## Cheatsheet` in the singular gets a second section instead of a merged one.
- Two notes with the same basename make every link to that name ambiguous. Check before
  choosing a slug.
- PDFs embed and render inline with `![[file.pdf]]`, same syntax as images.
