#!/usr/bin/env python3
"""TSV der Messung + data/manual.json -> JSON für den Dataview-Block der Notiz.

Aufruf: to_json.py <messung.tsv> <manual.json> <ausgabe.json>
Gibt Änderungen gegenüber der vorhandenen Ausgabedatei als +/-/~ Zeilen aus.
"""
import csv, datetime, json, os, re, sys

tsv, manual_path, out = sys.argv[1:4]

def short_host(h):
    h = h.removesuffix(".home.janbaer.de").removeprefix("jabasoft-")
    return h.replace("nixos-lxc-", "lxc-")

def clean_version(v):
    return re.sub(r"^(Python |v)", "", v.strip())

def norm_runtime(r):
    return {"python3": "python", "python": "python"}.get(r, r)

entries = {}
with open(tsv) as f:
    for row in csv.DictReader(f, delimiter="\t"):
        if not row["version"]:
            continue
        e = {
            "service": row["container"],
            "host": short_host(row["host"]),
            "runtime": norm_runtime(row["runtime"]),
            "version": clean_version(row["version"]),
            "image": row["image"],
            "source": "measured",
        }
        entries[(e["service"], e["host"], e["runtime"])] = e

for m in json.load(open(manual_path)):
    e = {
        "service": m["service"],
        "host": short_host(m["host"]),
        "runtime": m["runtime"],
        "version": m["version"],
        "image": "",
        "source": "manual",
        "as_of": m["as_of"],
    }
    entries.setdefault((e["service"], e["host"], e["runtime"]), e)

rows = sorted(entries.values(), key=lambda e: (e["runtime"], e["service"], e["host"]))
data = {"measured": datetime.date.today().isoformat(), "entries": rows}

prev = {}
if os.path.exists(out):
    try:
        prev = {(e["service"], e["host"], e["runtime"]): e for e in json.load(open(out))["entries"]}
    except (ValueError, KeyError):
        pass

with open(out, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

for k, e in entries.items():
    p = prev.get(k)
    if p is None:
        print(f"+ {k[0]} ({k[1]}, {k[2]}) {e['version']}")
    elif p["version"] != e["version"]:
        print(f"~ {k[0]} ({k[1]}, {k[2]}) {p['version']} -> {e['version']}")
for k, p in prev.items():
    if k not in entries:
        print(f"- {k[0]} ({k[1]}, {k[2]}) {p['version']}")
print(out)
