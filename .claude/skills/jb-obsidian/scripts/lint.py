#!/usr/bin/env python3
import argparse
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

SKIP_DIRS = {"_templates", "copilot", "Handoffs"}
SKIP_NOTES = {"agents", "claude", "index", "log"}
REQUIRED = ("created", "type", "tags", "status")
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
INDEX_ENTRY = re.compile(r"^- \[\[([^\]|#]+)[^\]]*\]\](?: — (.+?/|root)(?: — |$))?")
MAX_LINES = 25


def cli(vault, *args):
    result = subprocess.run(["obsidian", f"vault={vault}", *args], capture_output=True, text=True)
    if result.returncode or result.stdout.startswith("Error:"):
        sys.exit(f"obsidian {' '.join(args)} failed: {result.stdout}{result.stderr}".strip())
    return result.stdout


def section(text, heading):
    start = re.search(rf"^(#+) {re.escape(heading)}$", text, re.M)
    if not start:
        sys.exit(f"Schema has no section '{heading}'")
    level = len(start.group(1))
    end = re.compile(rf"^#{{1,{level}}} ", re.M).search(text, start.end())
    return text[start.end() : end.start() if end else len(text)]


def parse_schema(text):
    structure = section(text, "Directory Structure")
    return {
        "types": {t.strip() for t in re.search(r"^type: (.+)$", text, re.M).group(1).split("|")},
        "statuses": {s.strip() for s in re.search(r"^status: (.+)$", text, re.M).group(1).split("|")},
        "tags": set(re.findall(r"`([^`]+)`", section(text, "Canonical Tag List").split("**Tag merge rules")[0])),
        "dirs": set(re.findall(r"^([^\s/]+)/\s+—", structure, re.M)) | set(re.findall(r"`([^`/]+)/`", structure)),
        "root_files": set(re.findall(r"`([^`]+\.md)`", section(text, "Files that stay at vault root"))),
    }


def parse_frontmatter(text):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    fields, key = {}, None
    for line in lines[1:]:
        if line.strip() == "---":
            return fields
        match = re.match(r"^([\w-]+):\s*(.*)$", line)
        if match:
            key = match.group(1)
            fields[key] = match.group(2).strip()
        elif key and re.match(r"^\s*- ", line):
            if not isinstance(fields[key], list):
                fields[key] = []
            fields[key].append(line.split("- ", 1)[1].strip().strip("\"'"))
    return None


def parse_tags(value):
    if isinstance(value, list):
        return value
    if value.startswith("[") and value.endswith("]"):
        return [t.strip().strip("\"'") for t in value[1:-1].split(",") if t.strip()]
    return None


def in_scope(rel):
    return not (rel.parts[0] in SKIP_DIRS or any(p.startswith(".") for p in rel.parts))


def check_frontmatter(notes, schema):
    problems, unknown_tags = [], defaultdict(list)
    for rel, text in notes.items():
        fields = parse_frontmatter(text)
        if fields is None:
            problems.append(f"{rel}: no frontmatter")
            continue
        issues = [f"missing {k}" for k in REQUIRED if not fields.get(k)]
        if fields.get("type") and fields["type"] not in schema["types"]:
            issues.append(f"invalid type '{fields['type']}'")
        if fields.get("status") and fields["status"] not in schema["statuses"]:
            issues.append(f"invalid status '{fields['status']}'")
        for key in ("created", "updated"):
            if fields.get(key) and not DATE.match(str(fields[key]).strip("\"'")):
                issues.append(f"invalid {key} '{fields[key]}'")
        if fields.get("tags"):
            tags = parse_tags(fields["tags"])
            if tags is None:
                issues.append(f"tags is not a list: {fields['tags']}")
            else:
                if len(tags) > 6:
                    issues.append(f"{len(tags)} tags, maximum is 6")
                for tag in tags:
                    if tag not in schema["tags"]:
                        unknown_tags[tag].append(str(rel))
        if issues:
            problems.append(f"{rel}: {', '.join(issues)}")
    tag_lines = [
        f"{tag} ({len(files)}): {', '.join(files[:3])}{' ...' if len(files) > 3 else ''}"
        for tag, files in sorted(unknown_tags.items(), key=lambda item: -len(item[1]))
    ]
    return problems, tag_lines


def check_broken_links(vault):
    lines = []
    for row in cli(vault, "unresolved", "verbose").splitlines():
        target, _, sources = row.split("\t")
        kept = [s for s in sources.split(", ") if s != "Wiki-Maintenance/log.md"]
        if kept:
            lines.append((len(kept), f"{target} ({len(kept)}): {', '.join(kept[:3])}{' ...' if len(kept) > 3 else ''}"))
    return [line for _, line in sorted(lines, key=lambda item: -item[0])]


def check_orphans(vault):
    paths = (Path(p) for p in cli(vault, "orphans").splitlines())
    return [str(p) for p in paths if p.suffix == ".md" and in_scope(p) and p.stem.lower() not in SKIP_NOTES]


def check_placement(root, schema):
    lines = [
        f"root note: {p.name}"
        for p in sorted(root.glob("*.md"))
        if p.name not in schema["root_files"]
    ]
    lines += [
        f"directory not in schema: {p.name}/"
        for p in sorted(root.iterdir())
        if p.is_dir() and not p.name.startswith(".") and p.name not in schema["dirs"]
    ]
    return lines


def check_index(root, notes):
    by_name = defaultdict(list)
    for rel in notes:
        by_name[rel.stem.lower()].append(rel)
        by_name[str(rel.with_suffix("")).lower()].append(rel)
    all_notes = {p.relative_to(root) for p in root.rglob("*.md")}
    all_names = {p.stem.lower() for p in all_notes} | {str(p.with_suffix("")).lower() for p in all_notes}

    stale, indexed = [], set()
    for line in (root / "Wiki-Maintenance/index.md").read_text(errors="replace").splitlines():
        match = INDEX_ENTRY.match(line)
        if not match:
            continue
        name, label = match.group(1).strip(), match.group(2)
        found = by_name.get(name.lower(), [])
        indexed.update(found)
        if name.lower() not in all_names:
            stale.append(f"entry without note: {name}")
        elif label and found:
            actual = [("root" if p.parent == Path(".") else f"{p.parent}/") for p in found]
            if label not in actual:
                stale.append(f"wrong directory: {name} is labelled {label}, lives in {actual[0]}")
    missing = [str(rel) for rel in notes if rel not in indexed]
    return stale, missing


def report(title, lines, full):
    print(f"## {title} ({len(lines)})")
    shown = lines if full else lines[:MAX_LINES]
    for line in shown:
        print(f"- {line}")
    if len(shown) < len(lines):
        print(f"- ... {len(lines) - len(shown)} more, use --full")
    print()


def main():
    parser = argparse.ArgumentParser(description="Deterministic checks for the Obsidian wiki")
    parser.add_argument("--vault", default="Obsidian")
    parser.add_argument("--full", action="store_true", help=f"do not cap sections at {MAX_LINES} lines")
    args = parser.parse_args()

    root = Path(cli(args.vault, "vault", "info=path").strip())
    if not (root / "AGENTS.md").is_file():
        sys.exit(f"No AGENTS.md for vault '{args.vault}': {root}")
    schema = parse_schema((root / "AGENTS.md").read_text())
    notes = {
        rel: path.read_text(errors="replace")
        for path in sorted(root.rglob("*.md"))
        if in_scope(rel := path.relative_to(root)) and rel.stem.lower() not in SKIP_NOTES
    }

    frontmatter, tags = check_frontmatter(notes, schema)
    stale_index, not_indexed = check_index(root, notes)

    print(f"Checked {len(notes)} notes, skipped {', '.join(sorted(SKIP_DIRS))}\n")
    report("Broken links", check_broken_links(args.vault), args.full)
    report("Stale index entries", stale_index, args.full)
    report("Orphans", check_orphans(args.vault), args.full)
    report("Frontmatter", frontmatter, args.full)
    report("Non-canonical tags", tags, args.full)
    report("Placement", check_placement(root, schema), args.full)
    report("Missing from index", not_indexed, args.full)


if __name__ == "__main__":
    main()
