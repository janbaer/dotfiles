#!/usr/bin/env python3
"""Check the cheat sheet pages after an import.

Usage: verify.py [--vault DIR] [extra-page.md ...]

Scope is Cheatsheets/**/*.md plus any extra pages given (the hub pages the import
touched). Reports broken embeds, unresolved wikilinks, cheat sheet artifacts that no
page embeds, and note names that exist twice (which makes links to them ambiguous).

Stale asset links are checked vault-wide, not just in scope: renaming an artifact
breaks any page that linked it by its old name or by a path, and those pages are
usually nowhere near the import.

Exits non-zero when something is wrong.
"""
import collections
import pathlib
import re
import sys

args = sys.argv[1:]
vault = pathlib.Path.home() / "Documents/Obsidian"
if "--vault" in args:
    i = args.index("--vault")
    vault = pathlib.Path(args[i + 1])
    del args[i:i + 2]
extra = [pathlib.Path(a) for a in args]

SKIP = (".trash", "_templates", ".obsidian")
ASSET_SUFFIX = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".svg"}
FENCE = re.compile(r"```.*?```", re.S)
INLINE = re.compile(r"`[^`\n]*`")


def wanted(p):
    return not any(s in str(p) for s in SKIP)


def prose(p):
    """File text with code blocks removed, so bash [[ ]] tests are not read as links."""
    return INLINE.sub("", FENCE.sub("", p.read_text(errors="replace")))


notes = collections.defaultdict(list)
for p in vault.rglob("*.md"):
    if wanted(p):
        notes[p.stem].append(p)

assets = collections.defaultdict(list)
for p in vault.rglob("*"):
    if p.is_file() and p.suffix.lower() in ASSET_SUFFIX and wanted(p):
        assets[p.name].append(p)

scope = sorted(set(list((vault / "Cheatsheets").rglob("*.md")) + extra))
bad_embeds, bad_links = [], []
for p in scope:
    if not p.exists():
        bad_links.append(f"(missing page) {p}")
        continue
    text, rel = prose(p), p.relative_to(vault) if vault in p.parents else p
    for m in re.finditer(r"!\[\[([^\]|#]+)", text):
        if m.group(1).strip() not in assets:
            bad_embeds.append(f"{rel} -> {m.group(1).strip()}")
    for m in re.finditer(r"(?<!!)\[\[([^\]|#]+)", text):
        t = m.group(1).strip()
        if t not in notes and t not in assets and t.split("/")[-1] not in notes:
            bad_links.append(f"{rel} -> {t}")

def resolve_asset(target):
    """Files an asset wikilink can resolve to. Empty list means it resolves to nothing.

    Obsidian accepts both a bare filename and a vault-relative path, so both forms
    have to be checked against disk. A bare name that several files share resolves
    ambiguously, so every candidate counts as linked.
    """
    if "/" in target:
        p = (vault / target)
        return [p] if p.is_file() else []
    return list(assets.get(target, []))


# vault-wide: links to an artifact that no longer resolves (renamed or moved away)
stale = []
linked_assets = set()
for p in vault.rglob("*.md"):
    if not wanted(p):
        continue
    for m in re.finditer(r"!?\[\[([^\]|#]+)", prose(p)):
        t = m.group(1).strip()
        if not re.search(r"\.(jpg|jpeg|png|gif|pdf|svg)$", t, re.I):
            continue
        hits = resolve_asset(t)
        if not hits:
            stale.append(f"{p.relative_to(vault)} -> {t}")
        linked_assets.update(h.resolve() for h in hits)

unused = sorted(
    name for name, paths in assets.items()
    if any("Cheatsheets" in str(x) and "files" in x.parts for x in paths)
    and not any(x.resolve() in linked_assets for x in paths)
)
ambiguous = {k: [str(x.relative_to(vault)) for x in v] for k, v in notes.items() if len(v) > 1}

problems = 0
for label, items, fatal in [
    ("broken embeds", sorted(set(bad_embeds)), True),
    ("unresolved wikilinks", sorted(set(bad_links)), True),
    ("cheat sheet files no page embeds", unused, True),
    ("stale asset links (vault-wide)", sorted(set(stale)), True),
    ("ambiguous note names (vault-wide, warning)", [f"{k}: {v}" for k, v in ambiguous.items()], False),
]:
    print(f"=== {label} ({len(items)}) ===")
    print("\n".join(items) if items else "none")
    print()
    if fatal:
        problems += len(items)

print(f"pages checked: {len(scope)}")
sys.exit(1 if problems else 0)
