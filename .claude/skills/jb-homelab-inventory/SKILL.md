---
name: homelab-inventory
description: Erstellt oder aktualisiert die Notiz "homelab-techstack" mit Laufzeit und Version (Node.js, Bun, Python, Go, Rust, PHP) je Homelab-Dienst, damit klar ist, welche Sicherheitslücke welchen Dienst trifft. Verwenden bei "Homelab-Inventory", "Techstack-Inventar aktualisieren", "welche Versionen laufen im Homelab", "bin ich von der Node.js/Python/Go/PHP-Lücke betroffen" und wenn eine neue CVE in einer Laufzeit bekannt wird.
---

# Homelab-Inventory

Misst, welche Laufzeit in welcher Version hinter jedem laufenden Container steckt, und pflegt daraus die Notiz `homelab-techstack` im Obsidian-Vault. Jan gibt keine weiteren Anweisungen: Messung, Ziel und Format stehen hier. Die Unterhaltung ist deutsch.

## Voraussetzungen

- Repo `ansible-homelab` ausgecheckt (Standard `~/Projects/ansible-homelab`), SSH auf alle Hosts darin, `go` im PATH.
- Obsidian-CLI ist **optional**. Fehlt sie oder ist der Vault nur lesbar, endet der Skill nach Schritt 3 mit der fertigen Datei und sagt, wo sie liegt. Er schreibt nie an einem Pfad vorbei, den der laufende Obsidian nicht benutzt (`~/.config/obsidian/obsidian.json`, nicht `/mnt/zb-data/webdav/data/Obsidian`).

## Schritte

1. **Messen**

   ```bash
   scripts/measure.sh [repo] [ausgabe.tsv]
   ```

   Pfad relativ zu dieser `SKILL.md`. Liefert TSV mit `host, container, image, runtime, version`. Dauert rund eine halbe Minute. Es werden nur laufende Container gemessen. Go/Rust wird nur bei Containern ohne Node, Bun, Python oder PHP gesucht; ein Go-Binary neben einer Skriptlaufzeit bleibt unvermessen.

2. **Lücken schließen, die das Skript nicht sieht.** Als "offen" kennzeichnen, nicht raten:
   - Go-/Rust-Dienste auf `jabasoft-ug` (Binaries lassen sich dort nicht auslesen). Die letzte bekannte Version aus der bestehenden Notiz übernehmen und mit Datum als alt markieren.
   - Rust ohne `rustc`-String im Binary (vaultwarden, microbin): "offen".
   - Datenbanken, Caches und Webserver (mariadb, memcached, valkey, redis, postgres, nginx): Version aus dem Image-Tag in `services/<name>/defaults.yml` oder aus dem laufenden Container (`docker ps`), kein Laufzeit-Check.
   - Statische Images (it-tools, bento-pdf) und `llama.cpp`: kein Laufzeit-Eintrag, nur Hinweis in "C, C++ und Sonstiges".
   - PHP: nirgends gefunden bedeutet, dass der Lauf keinen Treffer in `runtime=php` hat. Dann bleibt der Hinweis "Kein PHP im Homelab" mit dem Messdatum stehen. Bei einem Treffer eigener Abschnitt "PHP" und im Chat nennen.

3. **Notiz rendern.** Struktur wie die bestehende Notiz, nichts umbauen:
   - Frontmatter: `created` bleibt, `updated` = heute (`date +%F`), `type: reference`, `tags: [homelab, docker, security]`, `status: draft`. `draft` bleibt, Jan setzt `active`.
   - Abschnitte in dieser Reihenfolge: Node.js, Bun (eigene Software), Python, Go, Rust, C/C++ und Sonstiges, Auffälligkeiten, Messung wiederholen, References.
   - Eine Tabelle je Laufzeit mit `Dienst | Version | Host`. Host kurz (`lxc-01`, `lxc-11`, `zb`, `ug`). Ein Dienst, der zwei Laufzeiten nutzt, steht in beiden, mit Hinweis auf die andere.
   - Go/Rust sind die Compiler-Version des Binaries, nicht eine Laufzeit im Container. Das steht oben in der Notiz.
   - Auffälligkeiten: älteste und neueste Linie je Laufzeit, Dienste mit Tag `latest`, Abweichungen zwischen Hosts desselben Dienstes. Ein Satz je Punkt, nur was sich seit der letzten Messung geändert hat oder neu auffällt.
   - Deutsche Prosa ohne typografische Gedankenstriche, Umlaute korrekt.

   Gibt es die Notiz bereits (`obsidian vault="Obsidian" read file="homelab-techstack"`), sie nur aktualisieren: Tabellen und `updated` ersetzen, Auffälligkeiten neu schreiben, Rest unangetastet. Eine Version, die in der Messung **fehlt**, aber in der Notiz steht, kommt nicht stillschweigend raus: Container gestoppt oder umbenannt? Im Chat melden.

4. **Schreiben** (nur mit Obsidian-CLI und schreibbarem Vault). Ziel ist `DevOPs/Docker/homelab-techstack.md`. Neu anlegen mit `obsidian vault="Obsidian" create path=... silent`, danach die Datei einmal lesen und mit dem Schreibwerkzeug füllen (Details im Skill `obsidian`). Ist die Notiz neu, zusätzlich:
   - Zeile unter `## Homelab` in `My Current Techstack` ergänzen.
   - Zeile unter `## Reference` in `Wiki-Maintenance/index.md` ergänzen.

   Immer: Eintrag in `Wiki-Maintenance/log.md` mit `## [YYYY-MM-DD] create | homelab-techstack` (neu) bzw. `update | homelab-techstack` (Aktualisierung).

5. **Berichten.** Pfad der Notiz, was sich gegenüber der letzten Messung geändert hat (neue, entfernte, angehobene Versionen) und die offenen Punkte. Kurz.

## Fragen, die der Skill beantwortet

"Bin ich von CVE-X in Laufzeit Y betroffen?": Messung neu laufen lassen (die Notiz kann veraltet sein), die betroffenen Versionen aus der Quelle der CVE mit den Tabellen abgleichen, Treffer mit Dienst und Host nennen. Bei `latest`-Tags gilt die gemessene Version, nicht der Tag.
