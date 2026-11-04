---
name: dictates
description: "Arbeitet die Diktate aus Dictates/ in der Obsidian-Vault Notes ab (Tagebuch, Idee, Vikunja-Task, Mail, Termin) und archiviert sie. Trigger: 'Diktate abarbeiten', 'neue Diktate', 'was hab ich diktiert', '/dictates'."
model: sonnet
---

# Diktate abarbeiten

Jan spricht unterwegs über Uhr oder Smartphone Diktate ein. Sie landen als `Dictates/{YYYY-MM-DD}_{HHMM}_{slug}.md` in der Vault Notes.

Vault-Pfad:

```bash
V=$(gojq -r '[.vaults[] | .path] | map(select(endswith("/Notes"))) | first' ~/.config/obsidian/obsidian.json)
[ -d "$V/Dictates" ] || { echo "Dictates-Ordner nicht gefunden: $V/Dictates"; exit 1; }
```

Ohne den Ordner abbrechen: mit leerem `V` zeigt das `mv` in Schritt 5 auf `/Dictates`.

## Ablauf

1. **Einsammeln:** `find "$V/Dictates" -maxdepth 1 -type f | sort`, älteste zuerst. Keine `.md`-Datei: "Keine neuen Diktate." und Schluss. Dateien mit anderer Endung (z. B. `.conflict1`) sind Sync-Konflikte: Ist der Inhalt eine ältere, kürzere Fassung eines Diktats, das du gerade verarbeitest, wandert die Datei mit ins Archiv. Sonst nennen und liegen lassen.

2. **Lesen und einordnen.** Datum und Uhrzeit der Aufnahme stehen im Dateinamen; sie gelten, nicht `date`. Aktionen: Tagebuch, Idee, Aufgabe, Mail, Termin. Ein Schlüsselwort am Anfang ("Tagebucheintrag", "Idee", "Aufgabe", "Mail an", "Termin") nennt die Aktion; sonst aus dem Inhalt: Erzählung über den Tag = Tagebuch, Vorhaben für später = Idee, zu Erledigendes = Aufgabe, Nachricht an eine Person = Mail. Ein Diktat kann mehrere Aktionen tragen. Mehrere Diktate zum selben Thema am selben Tag werden eine Aktion, alle Dateien wandern ins Archiv.

3. **Entscheiden, nicht fragen.** Der Skill soll auch unbeaufsichtigt laufen, es gibt niemanden, der eine Frage beantwortet. Keine `AskUserQuestion`, kein Plan zur Bestätigung. Ist die Aktion eindeutig, wird sie ausgeführt. Lässt sie sich nicht sicher bestimmen, oder ist es ein Termin (`jb-mailbox-assistent` verlangt dafür ein OK, das hier nicht kommen kann), bleibt das Diktat liegen und die Rückmeldung in Schritt 6 sagt, welches und warum.

4. **Ausführen.** Relative Zeitangaben im Diktat ("morgen", "nächste Woche", "um 10") vorher gegen das Aufnahmedatum in absolute Angaben auflösen und so übergeben; das Diktat kann Tage alt sein. Idee, Aufgabe, Mail und Termin laufen parallel, Tagebuch-Aktionen nacheinander, eine Datei nach der anderen.
   - **Tagebuch:** selbst schreiben, siehe unten. `diary-daily-entry` schreibt immer in den heutigen Tag, ein Diktat gehört aber zum Aufnahmetag.
   - **Idee:** `Skill jb-ideas` mit `add {Diktattext}`.
   - **Aufgabe:** `Skill jb-vikunja-task-create` mit dem Diktattext.
   - **Mail, Termin:** `Skill jb-mailbox-assistent` mit dem Diktattext.

5. **Archivieren**, erst nachdem die Aktion gemeldet hat, dass sie durch ist, alle Dateien in einem Aufruf: `mkdir -p "$V/Dictates/Archive" && mv {dateien} "$V/Dictates/Archive/"`. `mkdir -p` ist nötig, der Sync räumt den leeren Archive-Ordner weg. Schlägt eine Aktion fehl, bleibt das Diktat liegen und du sagst, welches, warum und welche seiner Aktionen schon durch sind.

6. **Rückmeldung:** eine Zeile pro Diktat, was passiert ist und wohin es ging.

## Tagebuch schreiben

Ziel ist `$V/Weekly/Wochenbericht KW {NN}.md`, Abschnitt `## {Wochentag}`, beides aus dem Aufnahmedatum: `date -d {YYYY-MM-DD} +"%V %u"`. Die Wochentagsnummer 1 bis 7 wird Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag; nicht `%A`, das hängt an der Locale und trifft den bestehenden Abschnitt dann nicht. Lies die Datei vorher; mehrere Diktate für dieselbe Datei in einem Durchgang lesen und schreiben.

- Abschnitt vorhanden: ans Ende des Abschnitts anhängen, eingeleitet mit `**Update:** `.
- Abschnitt fehlt: `## {Wochentag}` ans Dateiende, Text direkt darunter, ohne Präfix.
- Datei fehlt: anlegen mit Frontmatter `created: {Montag der KW}` und `tags: []`, dann wie oben.

Der Text: Diktat-Rahmen ("Tagebucheintrag.") streichen, nach `german-text.md` bereinigen, Fließtext in Jans Stimme, Inhalt unverändert.
