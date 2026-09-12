#!/usr/bin/env python3
"""Rebuild Cheatsheets.md from the pages on disk.

Usage: generate-hub.py [cheatsheets-dir]

Reads every <topic>/<slug>.md, takes its H1 as the title and the first sentence
of its description as the blurb, and writes the topic-grouped index. The
"Related pages elsewhere" list and everything from "## External Links" down are
preserved from the current hub, so hand-maintained tail sections survive.
"""
import collections
import pathlib
import re
import subprocess
import sys

C = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else
                 pathlib.Path.home() / "Documents/Obsidian/Cheatsheets")
TODAY = subprocess.run(["date", "+%F"], capture_output=True, text=True).stdout.strip()

TITLES = {"k8s": "Kubernetes", "docker": "Docker", "terraform": "Terraform",
          "linux": "Linux", "networking": "Networking", "cloud": "Cloud",
          "git": "Git", "devops": "DevOps", "security": "Security and DevSecOps",
          "observability": "Observability", "python": "Python", "rust": "Rust",
          "coding": "Programming and Markup", "databases": "Databases", "ai": "AI"}
ORDER = ["k8s", "docker", "terraform", "linux", "networking", "cloud", "git", "devops",
         "security", "observability", "python", "rust", "coding", "databases", "ai"]

rows = collections.defaultdict(list)
for page in C.rglob("*.md"):
    if page.name == "Cheatsheets.md":
        continue
    text = page.read_text()
    m = re.search(r"^# (.+)$", text, re.M)
    if not m:
        print(f"WARNING no H1, skipped: {page}")
        continue
    body = text.split("**Keywords:**")[0].split("---\n", 2)[-1]
    lines = [l for l in body.splitlines() if l.strip() and not l.startswith("#")]
    desc = lines[0] if lines else ""
    first = desc.split(". ")[0]
    short = first.split(": ", 1)[1] if ": " in first else first
    short = short.rstrip(".")
    if len(short) > 95:
        short = short[:92].rsplit(" ", 1)[0] + " …"
    rows[page.parent.name].append((page.stem, m.group(1), short))

unknown = [t for t in rows if t not in ORDER]
if unknown:
    print(f"WARNING topics missing from ORDER, appended at the end: {unknown}")

out = ["---", "created: 2022-12-17", f"updated: {TODAY}", "type: hub",
       "tags: [reference, devops]", "status: active", "---", "", "# Cheatsheets", "",
       "Every cheat sheet has its own page, grouped by topic below. The sheet itself "
       "(image or PDF) is embedded on that page and lives in `Cheatsheets/<topic>/files/`.",
       "New sheets are imported with the `cheatsheet-import` skill.", ""]
total = 0
for topic in ORDER + sorted(unknown):
    if topic not in rows:
        continue
    out += [f"## {TITLES.get(topic, topic.title())}", ""]
    for slug, title, short in sorted(rows[topic], key=lambda r: r[1].lower()):
        out.append(f"- [[{slug}|{title}]] — {short}")
        total += 1
    out.append("")

old = (C / "Cheatsheets.md").read_text()
for marker in ("## Related pages elsewhere", "## External Links"):
    if marker in old:
        out.append(old[old.index(marker):].rstrip() + "\n")
        break
(C / "Cheatsheets.md").write_text("\n".join(out))
print(f"hub rebuilt: {total} sheets across {len([t for t in ORDER + unknown if t in rows])} topics")
