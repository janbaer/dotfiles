#!/usr/bin/env python3
"""Stage memory folders for a dream, show what the agents changed, apply.

The agents never write to live memory. They write to a staging copy, and
only rows ticked on the review page are copied back.

Usage:
  memstate.py save <run_dir> <memory_dir> [<memory_dir> ...]
      Copy each memory folder twice: to <run_dir>/backup/<slug>/memory/
      (untouched snapshot) and <run_dir>/staging/<slug>/memory/ (where the
      agents write). Prints JSON {memory_dir: staging_dir}.
  memstate.py diff <run_dir>
      Print JSON: every file added, changed or removed in staging compared
      with the snapshot, with a unified diff.
  memstate.py apply <run_dir> <memory_dir> <file.md>
      Copy one staged file into the live memory folder. Refuses if the live
      file changed since the snapshot (another chat wrote to it meanwhile).
      A file the agents removed is moved to <runs_dir>/removed/<slug>/,
      outside the run folder, so pruning old runs never deletes it.
  memstate.py unstage <run_dir> <memory_dir> <file.md>
      Throw away the agents' version of one staged file (a secret got in).
  memstate.py restore <run_dir> <memory_dir> <file.md>
      Put one live file back the way it was in the snapshot (deletes it if
      the snapshot did not have it). The current version goes to
      <run_dir>/reverted/ first.
  memstate.py backup-file <run_dir> <path>
      Copy any file (a rules file, an AGENTS.md) to <run_dir>/backup/apply/
      before the apply step edits it.
"""
import difflib
import json
import os
import shutil
import sys

MAP = "backup/map.json"


def slug_of(memory_dir):
    return os.path.basename(os.path.dirname(os.path.abspath(memory_dir)))


def load_map(run):
    p = os.path.join(run, MAP)
    return json.load(open(p)) if os.path.exists(p) else {}


def save(run, dirs):
    m = load_map(run)
    for d in dirs:
        d = os.path.abspath(os.path.expanduser(d))
        os.makedirs(d, exist_ok=True)
        name = slug_of(d)
        bak = os.path.join(run, "backup", name, "memory")
        stg = os.path.join(run, "staging", name, "memory")
        for dst in (bak, stg):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(d, dst)
        m[d] = {"backup": bak, "staging": stg}
    os.makedirs(os.path.join(run, "backup"), exist_ok=True)
    json.dump(m, open(os.path.join(run, MAP), "w"), indent=2)
    print(json.dumps({k: v["staging"] for k, v in m.items()}, indent=2))


def read(p):
    try:
        return open(p, errors="replace").read()
    except (FileNotFoundError, IsADirectoryError):
        return None


def entry(run, memory_dir):
    live = os.path.abspath(os.path.expanduser(memory_dir))
    e = load_map(run).get(live)
    if not e:
        sys.exit(f"no snapshot for {live}")
    return live, e


def safe_name(name):
    if os.path.basename(name) != name or not name.endswith(".md"):
        sys.exit(f"not a memory file name: {name}")
    return name


def diff(run):
    out = []
    for live, e in load_map(run).items():
        bak, stg = e["backup"], e["staging"]
        names = set(os.listdir(stg) if os.path.isdir(stg) else []) | set(os.listdir(bak))
        for n in sorted(names):
            if not n.endswith(".md"):
                continue
            a, b = read(os.path.join(bak, n)), read(os.path.join(stg, n))
            if a == b:
                continue
            status = "added" if a is None else "removed" if b is None else "changed"
            lines = list(difflib.unified_diff((a or "").splitlines(), (b or "").splitlines(), "before", "after", n=0, lineterm=""))
            body = [l for l in lines if l[:1] in "+-" and not l.startswith(("+++", "---"))]
            out.append({"memory_dir": live, "file": n, "status": status,
                        "added": sum(1 for l in body if l.startswith("+")),
                        "removed": sum(1 for l in body if l.startswith("-")),
                        "diff": body})
    return out


def apply(run, memory_dir, name):
    live, e = entry(run, memory_dir)
    name = safe_name(name)
    src, dst, snap = os.path.join(e["staging"], name), os.path.join(live, name), os.path.join(e["backup"], name)
    if read(dst) != read(snap):
        sys.exit(f"conflict: {dst} changed since the dream started; not applied")
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"applied {dst}")
    elif os.path.exists(dst):
        keep = os.path.join(os.path.dirname(run), "removed", slug_of(live))
        os.makedirs(keep, exist_ok=True)
        shutil.move(dst, os.path.join(keep, name))
        print(f"moved {dst} -> {keep}/")


def unstage(run, memory_dir, name):
    live, e = entry(run, memory_dir)
    name = safe_name(name)
    src, dst = os.path.join(e["backup"], name), os.path.join(e["staging"], name)
    if os.path.exists(src):
        shutil.copy2(src, dst)
    elif os.path.exists(dst):
        os.remove(dst)
    print(f"unstaged {name}")


def restore(run, memory_dir, name):
    live, e = entry(run, memory_dir)
    name = safe_name(name)
    src, dst = os.path.join(e["backup"], name), os.path.join(live, name)
    keep = os.path.join(run, "reverted", os.path.basename(os.path.dirname(live)))
    os.makedirs(keep, exist_ok=True)
    if os.path.exists(dst):
        shutil.copy2(dst, os.path.join(keep, name))
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"restored {dst}")
    elif os.path.exists(dst):
        os.remove(dst)
        print(f"removed {dst} (the snapshot did not have it)")


def backup_file(run, path):
    path = os.path.abspath(os.path.expanduser(path))
    dst = os.path.join(run, "backup", "apply", path.lstrip("/"))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(path) and not os.path.exists(dst):
        shutil.copy2(path, dst)
    print(f"backed up {path} -> {dst}")


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    cmd, run = sys.argv[1], os.path.abspath(os.path.expanduser(sys.argv[2]))
    if cmd == "save":
        save(run, sys.argv[3:])
    elif cmd == "diff":
        print(json.dumps(diff(run), indent=2, ensure_ascii=False))
    elif cmd == "apply" and len(sys.argv) == 5:
        apply(run, sys.argv[3], sys.argv[4])
    elif cmd == "unstage" and len(sys.argv) == 5:
        unstage(run, sys.argv[3], sys.argv[4])
    elif cmd == "restore" and len(sys.argv) == 5:
        restore(run, sys.argv[3], sys.argv[4])
    elif cmd == "backup-file" and len(sys.argv) == 4:
        backup_file(run, sys.argv[3])
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
