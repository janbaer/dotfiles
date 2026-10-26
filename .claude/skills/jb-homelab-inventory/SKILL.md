---
name: homelab-inventory
description: Misst Laufzeit und Version (Node.js, Bun, Python, Go, Rust, PHP) hinter jedem Homelab-Dienst und aktualisiert die Datei homelab-techstack.json, aus der die Notiz "homelab-techstack" per Dataview rendert. Verwenden bei "Homelab-Inventory", "Techstack-Inventar aktualisieren", "welche Versionen laufen im Homelab", "bin ich von der Node.js/Python/Go/PHP-Lücke betroffen" und wenn eine neue CVE in einer Laufzeit bekannt wird.
metadata:
  version: "2.1"
---

# Homelab-Inventory

Das Skript misst, die Notiz rendert. Der Skill schreibt keine Tabellen: `scripts/measure.sh` legt `homelab-techstack.json` ab, der `dataviewjs`-Block in der Notiz macht daraus Tabellen und Auffälligkeiten. Jan gibt keine weiteren Anweisungen. Die Unterhaltung ist deutsch.

## Aufruf

- `/jb-homelab-inventory`: voller Ablauf, einschließlich Einrichtung der Notiz, falls sie fehlt.
- `/jb-homelab-inventory update`: nur neu messen und die bestehende Notiz nachziehen (Schritt 1, 2 und der Teil von Schritt 3 für eine vorhandene Notiz). Fehlt die Notiz, nichts anlegen, sondern sagen, dass der Aufruf ohne `update` nötig ist.

## Voraussetzungen

- Repo `ansible-homelab` ausgecheckt (Standard `~/Projects/ansible-homelab`), SSH auf alle Hosts darin, `go` und `python3` im PATH.
- Obsidian-CLI ist nur für die Ersteinrichtung der Notiz nötig. Ist der Vault nur lesbar (z. B. bei Hermes), die JSON-Datei in ein beschreibbares Verzeichnis legen (zweites Argument) und sagen, wohin.

## Ablauf

1. **Messen und ablegen**

   ```bash
   scripts/measure.sh [repo] [ausgabe.json]
   ```

   Pfad relativ zu dieser `SKILL.md`. Die Ausgabe landet standardmäßig in `~/Documents/Obsidian/DevOPs/Docker/homelab-techstack.json` (den Vault-Pfad nur aus `~/.config/obsidian/obsidian.json` nehmen, nie aus `/mnt/zb-data/webdav/data/Obsidian`). Dauert rund zwei Minuten. Gemessen werden nur laufende Container. Go/Rust wird nur bei Containern ohne Node, Bun, Python oder PHP gesucht. Das Skript gibt die Änderungen gegenüber der vorigen Datei aus (`+` neu, `-` weg, `~` Version geändert).

2. **Berichten.** Die Änderungen nennen. Ein `-` ist verdächtig (Container gestoppt oder umbenannt?) und gehört in den Bericht, nicht still übernommen. Auf Warnungen der Form "Probe auf <host> fehlgeschlagen" hinweisen: dieser Host fehlt dann in der Messung.

3. **Notiz einrichten, nur wenn sie fehlt.** `DevOPs/Docker/homelab-techstack.md` aus `templates/techstack-note.md` anlegen (Datumsplatzhalter mit `date +%F` füllen, `status: draft`), außerdem:
   - Zeile unter `## Homelab` in `My Current Techstack`,
   - Zeile unter `## Reference` in `Wiki-Maintenance/index.md`,
   - Eintrag `## [YYYY-MM-DD] create | homelab-techstack` in `Wiki-Maintenance/log.md`.

   Existiert die Notiz, bleibt sie unberührt, nur `updated` im Frontmatter auf heute (`date +%F`) setzen und `## [YYYY-MM-DD] update | homelab-techstack` in `log.md` eintragen. Das ist auch der gesamte Schritt 3 bei `update`.

## Was das Skript nicht messen kann

Steht in `data/manual.json` (`service, host, runtime, version, as_of`): Binaries auf `jabasoft-ug`, Rust ohne `rustc`-String (vaultwarden, microbin), Datenbanken und Caches (Version aus dem Image-Tag in `services/<name>/defaults.yml`), statische Images und `llama.cpp`. Ein Eintrag erscheint nur, wenn die Messung ihn nicht selbst liefert. Ändert sich ein Wert, die Zeile dort anpassen und `as_of` setzen. Eine unbekannte Version steht als `"offen"`, nie geraten.

## Fragen, die der Skill beantwortet

"Bin ich von CVE-X in Laufzeit Y betroffen?": Messung neu laufen lassen (die Datei kann veraltet sein), die betroffenen Versionen aus der Quelle der CVE mit `entries` in der JSON abgleichen, Treffer mit Dienst und Host nennen. Bei `latest`-Tags gilt die gemessene Version, nicht der Tag. Kein Eintrag mit `runtime: php` bedeutet: kein PHP im Homelab.
