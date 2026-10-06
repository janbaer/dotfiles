#!/usr/bin/env python3
import argparse
import os
import re
import sys
from collections import defaultdict

MODELS = {"haiku", "sonnet", "opus", "inherit"}
RESERVED = ("anthropic", "claude")

REASONING = re.compile(
    r"(show|write out|explain|print|include)\s+(your|the)\s+(reasoning|thinking|thought process)"
    r"|chain[- ]of[- ]thought|think (out loud|step by step)"
    r"|denke?\s+laut|schritt\s+für\s+schritt\s+(denken|begründen)"
    r"|(schreibe|zeige|erkläre)\s+(dein|deine|deinen)\s+(denken|überlegung\w*|gedanken\w*|begründung\w*)",
    re.I,
)
VERIFY = re.compile(
    r"double[- ]check|re-?verify|final verification|verification step|verify (your|the) (own )?(work|answer)"
    r"|prüfe?\s+(es|das|dein\w*)\s+(nochmal|noch einmal|erneut)|kontrolliere\s+(es\s+)?(nochmal|noch einmal)",
    re.I,
)
TOOL_DISCOURAGE = re.compile(
    r"minimi[sz]e tool calls|only use tools when|strictly necessary|so wenig tool|nur wenn unbedingt",
    re.I,
)
EMPHASIS = re.compile(
    r"\b(CRITICAL|MUST|NEVER|ALWAYS|IMPORTANT|UNBEDINGT|NIEMALS|IMMER|WICHTIG)\b"
)
DESTRUCTIVE = re.compile(
    r"--force|push -f|rm -rf|reset --hard|branch -D|clean -f|DROP (TABLE|DATABASE)", re.I
)
DATE = re.compile(r"\b20\d\d-\d\d-\d\d\b")
MODEL_NAME = re.compile(r"\b(haiku|sonnet|opus|fable|mythos)\b[ -]?\d*(\.\d+)?", re.I)
INSTALL = re.compile(r"pip install|npm i(nstall)?\b|bun add|nix[- ]shell|apt(-get)? install|brew install|uv (pip|run)", re.I)
MD_LINK = re.compile(r"\]\(([^)#\s]+\.md)\)|`([A-Za-z0-9_./-]+\.md)`")
TOC = re.compile(r"^#+\s*(contents|inhalt|inhaltsverzeichnis|table of contents)\b", re.I | re.M)
CHECKLIST = re.compile(r"^\s*-\s\[ \]", re.M)
GOTCHAS = re.compile(r"^#+\s*gotchas?\b", re.I | re.M)
DATE_CMD = re.compile(r"\bdate\s+[+-]")
DATE_INJECT = re.compile(r"!`date\b|^```!\s*\n[^`]*\bdate\b", re.M)
DAILY = re.compile(r"jb-(diary|handoff|forgejo|grill-me|vikunja|obsidian)")


def parse_frontmatter(text):
    m = re.match(r"---\n(.*?)\n---\n?(.*)", text, re.S)
    if not m:
        return None, text
    fm, key = {}, None
    for line in m.group(1).split("\n"):
        k = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
        if k:
            key, v = k.group(1), k.group(2).strip()
            if v in (">", "|", ">-", "|-"):
                v = ""
            fm[key] = v.strip("\"'")
        elif key and line.startswith((" ", "\t")):
            fm[key] = (fm[key] + " " + line.strip()).strip()
    return fm, m.group(2)


def collect(root, only):
    items = []
    for entry in sorted(os.listdir(os.path.join(root, "skills"))):
        path = os.path.join(root, "skills", entry, "SKILL.md")
        if entry.startswith("jb-") and os.path.isfile(path):
            items.append(("skill", entry, path))
    for kind, sub in (("agent", "agents"), ("command", "commands")):
        d = os.path.join(root, sub)
        if os.path.isdir(d):
            for f in sorted(os.listdir(d)):
                if f.endswith(".md"):
                    items.append((kind, f[:-3], os.path.join(d, f)))
    if only:
        items = [i for i in items if any(o in i[1] for o in only)]
    return items


def only_stdlib(path):
    text = open(path, encoding="utf-8").read()
    mods = {m.split(".")[0] for m in re.findall(r"^\s*(?:import|from)\s+([A-Za-z_][\w.]*)", text, re.M)}
    return all(m in sys.stdlib_module_names or m == "__future__" for m in mods)


def support_files(skill_path):
    base = os.path.dirname(skill_path)
    out = []
    for dirpath, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d != "__pycache__"]
        for f in files:
            full = os.path.join(dirpath, f)
            if full != skill_path:
                out.append(full)
    return sorted(out)


def audit(kind, name, path):
    text = open(path, encoding="utf-8").read()
    fm, body = parse_frontmatter(text)
    f = []
    if fm is None:
        return {"kind": kind, "name": name, "model": "-", "lines": len(text.splitlines()), "findings": [("G0", "no frontmatter")]}
    model = fm.get("model", "")
    desc = fm.get("description", "")
    lines = len(body.splitlines())

    if model and model not in MODELS and not model.startswith("claude-"):
        f.append(("G1", f"model value '{model}' is not a known alias"))
    sname = fm.get("name", "")
    if kind == "skill":
        if not re.fullmatch(r"[a-z0-9-]{1,64}", sname or ""):
            f.append(("G1", f"name '{sname}' is not kebab-case or exceeds 64 chars"))
        if any(r in sname for r in RESERVED):
            f.append(("G1", f"name '{sname}' contains a reserved word"))
    when = fm.get("when_to_use", "")
    if not desc:
        f.append(("G2", "description missing"))
    else:
        if len(desc) + len(when) > 1536:
            f.append(("G2", f"description + when_to_use {len(desc) + len(when)} chars (limit 1536)"))
        if "<" in desc or ">" in desc:
            f.append(("G2", "description contains < or >"))
        if kind == "skill" and not re.search(r"\b(use when|use whenever|use for|use to|use this|trigger|wenn|verwenden|verwende|sobald|bei)\b", desc, re.I):
            f.append(("G2", "description shows no trigger wording (manual check: WHEN missing?)"))
    if lines > 500:
        f.append(("G3", f"body {lines} lines (limit 500)"))

    if kind == "skill":
        for sf in support_files(path):
            rel = os.path.relpath(sf, os.path.dirname(path))
            if sf.endswith(".md"):
                t = open(sf, encoding="utf-8").read()
                n = len(t.splitlines())
                if n > 100 and not TOC.search(t):
                    f.append(("G4", f"{rel} has {n} lines and no contents list"))
                if MD_LINK.search(t):
                    f.append(("G5", f"{rel} links to other .md files (nesting?)"))
            if sf.endswith(".py") and only_stdlib(sf):
                continue
            if sf.endswith((".py", ".sh")) and not INSTALL.search(body):
                f.append(("G7", f"script {rel} but SKILL.md names no install line (manual check: does it need packages?)"))

    for label, rx, rule, tmpl in (
        ("reasoning", REASONING, "G8", "asks for reasoning in the reply: {}"),
        ("verify", VERIFY, "O1", "explicit verification instruction: {}"),
        ("tooldiscourage", TOOL_DISCOURAGE, "S1", "discourages tool use: {}"),
    ):
        for m in rx.finditer(body):
            f.append((rule, tmpl.format(m.group(0))))

    dates = DATE.findall(body)
    names = sorted({m.group(0).strip() for m in MODEL_NAME.finditer(body)})
    if dates or names:
        f.append(("G6", f"{len(dates)} date(s), model names: {', '.join(names) or '-'} (manual check: example or time-sensitive?)"))
    if kind == "skill":
        if "disable-model-invocation" not in fm:
            f.append(("G13", "model-invocable (manual-only? then set disable-model-invocation: true)"))
        if DAILY.search(name) and lines >= 100 and not GOTCHAS.search(body):
            f.append(("G12", "daily skill without a Gotchas section"))
        if DATE_CMD.search(body) and not DATE_INJECT.search(text):
            f.append(("D1", "tells the model to run date, no !`date` injection"))
    emph = len(EMPHASIS.findall(body))
    if emph >= 5:
        f.append(("E1", f"{emph} emphasis words (video claim, not in official docs)"))
    destr = len(DESTRUCTIVE.findall(body))
    if destr:
        f.append(("F1", f"{destr} destructive commands (manual check: low freedom / script?)"))
    return {
        "kind": kind, "name": name, "model": model or "-", "lines": lines,
        "checklist": len(CHECKLIST.findall(body)), "findings": f,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=os.path.expanduser("~/Projects/dotfiles/.claude"))
    ap.add_argument("names", nargs="*")
    a = ap.parse_args()
    results = [audit(*i) for i in collect(a.root, a.names)]

    by_model = defaultdict(list)
    for r in results:
        by_model[r["model"]].append(r)
    print("## Overview\n")
    print("| model | count | with findings |")
    print("|---|---|---|")
    for m in sorted(by_model):
        rs = by_model[m]
        print(f"| {m} | {len(rs)} | {sum(1 for r in rs if r['findings'])} |")
    for m in sorted(by_model):
        print(f"\n## model: {m}\n")
        print("| type | name | lines | findings |")
        print("|---|---|---|---|")
        for r in by_model[m]:
            fs = "<br>".join(f"{rid}: {msg}" for rid, msg in r["findings"]) or "-"
            print(f"| {r['kind']} | {r['name']} | {r['lines']} | {fs} |")
    return 0


if __name__ == "__main__":
    sys.exit(main())
