#!/usr/bin/env python3
"""Find Claude Code chats and slim them to plain text for a dream run.

Works on macOS and Linux with Python 3.9 or newer.

Usage:
  chats.py list [--days N]
      Print every Claude Code project folder with its chat count, last use,
      real folder path and memory size, as JSON. Used by the setup talk.

  chats.py collect <run_dir> --config <config.json> [--since ISO] [--max-group-kb N]
      Find chats in the configured scope that changed since the last run,
      slim each one to text (secrets removed), and write:
        <run_dir>/chats/<project-slug>/<chat-id>.txt
        <run_dir>/plan.json   (chat list, groups for the analyzers, totals)

  chats.py stamp
      Print the current time as ISO with a UTC offset, for last_run.

  chats.py prune <runs_dir> [--days N]
      Delete applied run folders (state.json status "done") whose date
      is older than N days (default 30). Unapplied runs are kept.

Only reads ~/.claude/projects/. Never edits a chat file.
"""
import argparse
import glob
import json
import os
import re
import shutil
import time
from datetime import datetime, timezone

PROJECTS = os.path.expanduser("~/.claude/projects")

# A chat still being written to is skipped. It is picked up on the next run.
QUIET_MINUTES = 20

TOOL_RESULT_CHARS = 300
TOOL_INPUT_CHARS = 150
USER_TEXT_CHARS = 6000
ASSISTANT_TEXT_CHARS = 6000

SECRET_PATTERNS = [
    re.compile(r"sk-ant-[A-Za-z0-9_\-]{20,}"),
    re.compile(r"sk-(?:proj-)?[A-Za-z0-9_\-]{20,}"),
    re.compile(r"(?:ghp|gho|ghu|ghs|github_pat)_[A-Za-z0-9_]{20,}"),
    re.compile(r"glpat-[A-Za-z0-9_\-]{20,}"),
    re.compile(r"(?:hf|npm|tk)_[A-Za-z0-9]{20,}"),
    re.compile(r"xox[abprs]-[A-Za-z0-9\-]{10,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"AIza[0-9A-Za-z_\-]{30,}"),
    re.compile(r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}"),
    # Forgejo/Gitea tokens are bare 40-hex. Full commit SHAs get caught too.
    re.compile(r"\b[0-9a-f]{40}\b|\b[0-9a-f]{64}\b"),
    re.compile(r"((?:[a-z][a-z0-9+.\-]*)://[^\s/:@]+:)[^\s/@]+(?=@)", re.I),
    re.compile(r"(?i)((?:bearer|basic)\s+)[A-Za-z0-9_\-\.=+/]{16,}"),
    re.compile(r"(?i)((?:api[_-]?key|secret|token|password|passwd|pwd)[\"']?\s*[:=]\s*[\"']?)[^\s\"',}]{8,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"AGE-SECRET-KEY-1[0-9A-Z]{50,}"),
]
REMINDER = re.compile(r"<system-reminder>[\s\S]*?</system-reminder>")


def parse_ts(s):
    """ISO timestamp to epoch seconds. Python 3.9 fromisoformat knows
    neither 'Z' nor '+0100', so both are normalized first."""
    s = s.strip().replace("Z", "+00:00")
    s = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", s)
    return datetime.fromisoformat(s).timestamp()


def redact(text):
    n = 0
    for p in SECRET_PATTERNS:
        def sub(m):
            nonlocal n
            n += 1
            g = m.groups()
            return (g[0] if g and g[0] else "") + "[SECRET REMOVED]"
        text = p.sub(sub, text)
    return text, n


def cut(text, limit):
    text = text.strip()
    if len(text) <= limit:
        return text
    return text[:limit] + f" [...{len(text) - limit} more chars]"


def block_text(b):
    if isinstance(b, str):
        return b
    if isinstance(b, dict):
        if b.get("type") == "text":
            return b.get("text", "")
        if isinstance(b.get("content"), (str, list)):
            return block_text(b["content"])
    if isinstance(b, list):
        return "\n".join(block_text(x) for x in b)
    return ""


def slim(path, since_ts=0):
    """Return (title, text, info) for one chat file.

    Only turns at or after since_ts are kept, so a long chat that was
    continued today gives only today's turns. Its first message is kept
    as context.
    """
    title, lines, cwd, first_user = "", [], "", ""
    n_user = n_asst = 0
    old_turns = 0
    for raw in open(path, errors="replace"):
        try:
            d = json.loads(raw)
        except ValueError:
            continue
        t = d.get("type")
        if t == "custom-title" and d.get("customTitle"):
            title = d["customTitle"]
        if t not in ("user", "assistant") or d.get("isSidechain"):
            continue
        cwd = cwd or d.get("cwd", "")
        ts = (d.get("timestamp") or "")[:16].replace("T", " ")
        try:
            old = since_ts and parse_ts(d["timestamp"]) < since_ts
        except (KeyError, ValueError, AttributeError):
            old = False
        content = (d.get("message") or {}).get("content")
        blocks = content if isinstance(content, list) else [{"type": "text", "text": content or ""}]
        for b in blocks:
            if not isinstance(b, dict):
                continue
            k = b.get("type")
            if t == "user" and k == "text":
                txt = REMINDER.sub("", b.get("text", "")).strip()
                if not txt:
                    continue
                if txt.startswith("Base directory for this skill:"):
                    if not old:
                        lines.append(f"[{ts}] SKILL LOADED: {txt.splitlines()[0][31:]}")
                    continue
                if old:
                    first_user = first_user or txt
                    old_turns += 1
                    continue
                first_user = first_user or txt
                n_user += 1
                lines.append(f"[{ts}] USER: {cut(txt, USER_TEXT_CHARS)}")
            elif old:
                continue
            elif t == "user" and k == "tool_result":
                res = block_text(b.get("content"))
                err = " (error)" if b.get("is_error") else ""
                lines.append(f"  RESULT{err}: {cut(REMINDER.sub('', res), TOOL_RESULT_CHARS)}")
            elif t == "assistant" and k == "text":
                txt = b.get("text", "").strip()
                if txt:
                    n_asst += 1
                    lines.append(f"[{ts}] CLAUDE: {cut(txt, ASSISTANT_TEXT_CHARS)}")
            elif t == "assistant" and k in ("tool_use", "server_tool_use"):
                inp = json.dumps(b.get("input", {}), ensure_ascii=False)
                lines.append(f"  TOOL {b.get('name')}: {cut(inp, TOOL_INPUT_CHARS)}")
    if old_turns:
        lines.insert(0, f"(This chat started earlier. {old_turns} older user turns were read in past runs and are left out. It began with: {cut(first_user, 400)})\n")
    text, n_secrets = redact("\n".join(lines))
    first_clean, _ = redact(first_user[:200])
    info = {"cwd": cwd, "user_turns": n_user, "claude_turns": n_asst,
            "secrets_removed": n_secrets, "first_user": first_clean}
    return title, text, info


def project_path(slug_dir):
    """Real folder path for a project folder, read from its newest chat."""
    for f in sorted(glob.glob(os.path.join(slug_dir, "*.jsonl")), key=os.path.getmtime, reverse=True)[:3]:
        for raw in open(f, errors="replace"):
            if '"cwd"' in raw:
                try:
                    c = json.loads(raw).get("cwd")
                    if c:
                        return c
                except ValueError:
                    pass
    return ""


def memory_info(slug_dir):
    mdir = os.path.join(slug_dir, "memory")
    idx = os.path.join(mdir, "MEMORY.md")
    files = glob.glob(os.path.join(mdir, "*.md"))
    lines = sum(1 for _ in open(idx)) if os.path.exists(idx) else 0
    return {"memory_dir": mdir, "memory_files": len(files), "memory_index_lines": lines}


def cmd_list(days):
    cutoff = time.time() - days * 86400
    out = []
    for d in sorted(glob.glob(os.path.join(PROJECTS, "*/"))):
        chats = glob.glob(os.path.join(d, "*.jsonl"))
        if not chats:
            continue
        recent = [c for c in chats if os.path.getmtime(c) >= cutoff]
        last = max(os.path.getmtime(c) for c in chats)
        row = {"slug": os.path.basename(d.rstrip("/")), "path": project_path(d),
               "chats": len(chats), f"chats_last_{days}_days": len(recent),
               "last_used": datetime.fromtimestamp(last).strftime("%Y-%m-%d")}
        row.update(memory_info(d))
        out.append(row)
    out.sort(key=lambda r: r["last_used"], reverse=True)
    print(json.dumps(out, indent=2))


def is_dream_chat(info):
    """Skip the dream's own run chats so it never dreams about dreaming."""
    first = info.get("first_user", "").lower().lstrip()
    # Typed "/dream", or a slash command (stored as <command-message>dream or
    # <command-name>/dream).
    return (first.startswith("/dream") or "dream run" in first[:80]
            or "<command-message>dream</command-message>" in first[:200]
            or "<command-name>/dream" in first[:300])


def cmd_collect(run_dir, config_path, since, max_group_kb):
    cfg = json.load(open(config_path))
    if cfg.get("scope") == "all":
        slugs = [os.path.basename(d.rstrip("/")) for d in glob.glob(os.path.join(PROJECTS, "*/"))]
    else:
        slugs = [p["slug"] for p in cfg.get("projects", [])]
    if since:
        since_ts = parse_ts(since)
    elif cfg.get("last_run"):
        since_ts = parse_ts(cfg["last_run"])
    else:
        since_ts = time.time() - int(cfg.get("first_run_days", 7)) * 86400
    quiet_ts = time.time() - QUIET_MINUTES * 60

    pending_ts = {}
    for k, v in (cfg.get("pending") or {}).items():
        try:
            pending_ts[k] = parse_ts(v)
        except (TypeError, ValueError, AttributeError):
            pass
    new_pending = {}

    sources = [(f, slug, os.path.join(PROJECTS, slug, "memory"))
               for slug in slugs for f in glob.glob(os.path.join(PROJECTS, slug, "*.jsonl"))]

    chats, skipped = [], {"still_open": 0, "dream_runs": 0, "empty": 0}
    for f, slug, mdir in sources:
        m = os.path.getmtime(f)
        cid = os.path.basename(f)[:-6]
        # A chat skipped as open on an earlier run keeps that run's start.
        chat_since = min(since_ts, pending_ts.get(cid, since_ts))
        if m < chat_since:
            continue
        if m > quiet_ts:
            skipped["still_open"] += 1
            new_pending[cid] = datetime.fromtimestamp(chat_since, timezone.utc).isoformat(timespec="seconds")
            continue
        title, text, info = slim(f, chat_since)
        if info["user_turns"] == 0:
            skipped["empty"] += 1
            continue
        if is_dream_chat(info):
            skipped["dream_runs"] += 1
            continue
        out = os.path.join(run_dir, "chats", slug, cid + ".txt")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        header = f"CHAT {cid}\nTITLE {title or '(none)'}\nFOLDER {info['cwd']}\nLAST CHANGED {datetime.fromtimestamp(m).strftime('%Y-%m-%d %H:%M')}\n\n"
        with open(out, "w") as fh:
            fh.write(header + text)
        chats.append({"id": cid, "slug": slug, "title": title, "folder": info["cwd"],
                      "file": out, "kb": round(os.path.getsize(out) / 1024, 1),
                      "secrets_removed": info["secrets_removed"], "memory_dir": mdir})

    # Groups: chats from one project together, each group under max_group_kb.
    # One analyzer per group. A chat bigger than the cap gets a group of its own.
    groups = []
    for slug in sorted({c["slug"] for c in chats}):
        mdir = os.path.join(PROJECTS, slug, "memory")
        cur, size = [], 0
        for c in sorted((c for c in chats if c["slug"] == slug), key=lambda c: -c["kb"]):
            if cur and size + c["kb"] > max_group_kb:
                groups.append({"slug": slug, "memory_dir": mdir, "chats": cur, "kb": round(size, 1)})
                cur, size = [], 0
            cur.append(c["file"])
            size += c["kb"]
        if cur:
            groups.append({"slug": slug, "memory_dir": mdir, "chats": cur, "kb": round(size, 1)})

    plan = {
        "run_dir": os.path.abspath(run_dir),
        "since": datetime.fromtimestamp(since_ts, timezone.utc).isoformat(timespec="minutes"),
        "chats": chats,
        "groups": groups,
        "projects": sorted({c["slug"] for c in chats}),
        "totals": {"chats": len(chats), "kb": round(sum(c["kb"] for c in chats), 1),
                   "groups": len(groups), "secrets_removed": sum(c["secrets_removed"] for c in chats)},
        "skipped": skipped,
        "pending": new_pending,
    }
    with open(os.path.join(run_dir, "plan.json"), "w") as fh:
        json.dump(plan, fh, indent=2)
    # Remember chats left open, so the next run reads them from this run's
    # start even after last_run moves on. Only the "pending" key changes.
    cfg_now = json.load(open(config_path))
    cfg_now["pending"] = new_pending
    tmp = config_path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(cfg_now, fh, indent=2)
    os.replace(tmp, config_path)
    print(json.dumps({"totals": plan["totals"], "skipped": skipped, "projects": plan["projects"],
                      "plan": os.path.join(run_dir, "plan.json")}, indent=2))


def cmd_prune(runs_dir, days):
    cutoff = time.time() - days * 86400
    for d in sorted(glob.glob(os.path.join(runs_dir, "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*/"))):
        if datetime.strptime(os.path.basename(d.rstrip("/"))[:10], "%Y-%m-%d").timestamp() >= cutoff:
            continue
        try:
            done = json.load(open(os.path.join(d, "state.json"))).get("status") == "done"
        except (OSError, ValueError):
            done = False
        if done:
            shutil.rmtree(d)
            print(f"removed {d}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    l = sub.add_parser("list")
    l.add_argument("--days", type=int, default=30)
    c = sub.add_parser("collect")
    c.add_argument("run_dir")
    c.add_argument("--config", required=True)
    c.add_argument("--since")
    c.add_argument("--max-group-kb", type=float, default=400)
    sub.add_parser("stamp")
    p = sub.add_parser("prune")
    p.add_argument("runs_dir")
    p.add_argument("--days", type=int, default=30)
    a = ap.parse_args()
    if a.cmd == "list":
        cmd_list(a.days)
    elif a.cmd == "stamp":
        print(datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"))
    elif a.cmd == "prune":
        cmd_prune(os.path.expanduser(a.runs_dir), a.days)
    else:
        os.makedirs(a.run_dir, exist_ok=True)
        cmd_collect(a.run_dir, a.config, a.since, a.max_group_kb)


if __name__ == "__main__":
    main()
