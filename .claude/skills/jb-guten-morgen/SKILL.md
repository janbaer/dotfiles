---
name: guten-morgen
description: "Morgenüberblick: was heute laut Wochenplan ansteht, welche Termine und Vikunja-Tasks fällig sind und welche Mails in den letzten zwölf Stunden gekommen sind. Verwenden bei 'Guten Morgen', 'guten Morgen Claude', '/guten-morgen', 'was steht heute an', 'Morgenüberblick'. Nicht für den Tagebucheintrag, der läuft über diary-daily-entry."
---

# Guten Morgen

Du gibst Jan einen kurzen Überblick über den Tag. Alles auf **Deutsch**, knapp, als Fließtext mit höchstens einer Liste pro Abschnitt. Der Skill liest nur: nichts schreiben, keine Mail öffnen oder als gelesen markieren, keine Tasks ändern.

## Ablauf

Starte 1 und 2 parallel, dann 3 bis 5.

1. **Datum:** Datum, Wochentag und Uhrzeit mit `LC_TIME=de_DE.UTF-8 date '+%F, %A, %H:%M'` holen, nie aus dem Kontext raten.
2. **Vikunja im Hintergrund:** Subagent `vikunja-agent` mit `run_in_background: true` und dem Prompt `Operation: list-due-today-or-overdue. Heutige fällige und überfällige Tasks als Markdown-Liste zurückgeben (oder 'keine'), wie in der Agent-Doku.`
3. **Wochenplan:** Vault-Pfad per `gojq -r '[.vaults[] | .path] | map(select(endswith("/Notes"))) | first' ~/.config/obsidian/obsidian.json` ermitteln, dann das Frontmatter von `{VAULT_PATH}/Auszeit-Plan.plan.md` lesen und den Tag mit dem heutigen `date` suchen. Montag bis Freitag zählen `weiterbildung`, `homelab`, `haushalt`, `anlass`, `sonstiges`, am Wochenende `notiz`; leere Felder bleiben weg. Fehlt Datei, Woche oder Tag, den Abschnitt weglassen.
4. **Termine:** `mcp__caldav-mcp__list-events` auf dem Kalender `/caldav/Y2FsOi8vMC8zMQ/` mit Fenster heute `00:00:00` bis `23:59:59` und dem lokalen Offset (nie `Z`). Zeiten kommen in UTC zurück und werden nach Europe/Berlin umgerechnet. Stimmt die URL nicht mehr, über `list-calendars` neu holen.
5. **Mails:** `mcp__imap-mcp__find_emails` mit `after: "12h"` auf `INBOX`. Nur Absender und Betreff verwenden, `fetch_email_content` nicht aufrufen.

## Ausgabe

Beginn mit einem kurzen "Guten Morgen" und dem Wochentag samt Datum. Dann nur die Abschnitte, in denen etwas steht:

- **Wochenplan:** was laut Plan heute ansteht, mit Blocknamen (`Weiterbildung: …`).
- **Termine:** Uhrzeit und Titel, ganztägige ohne Uhrzeit.
- **Vikunja:** fällige und überfällige Tasks, nur der Titel. Samstag und Sonntag fallen Tasks aus dem Projekt `CHECK24-BU` weg.
- **Mails:** Anzahl der Mails seit zwölf Stunden, dann Absender und Betreff der neuesten, höchstens zehn. Sind es mehr, die Restzahl nennen.

Ein leerer Abschnitt wird nicht erwähnt, auch nicht als "nichts". Ist alles leer, ein Satz dazu.

## Fehlerfälle

Ist Vikunja, CalDAV oder IMAP nicht erreichbar, in einem Satz sagen, welcher Dienst fehlt (bei CalDAV oder IMAP mit dem Hinweis auf `/mcp`), und mit dem Rest weitermachen.
