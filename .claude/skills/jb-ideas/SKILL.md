---
name: ideas
description: "Ideen-Backlog in der Obsidian-Vault Notes: eine Idee festhalten, die offenen Ideen auflisten, oder eine Idee mit grill-me ausarbeiten und daraus ein Forgejo-Issue machen. Trigger: 'ich hab eine Idee', 'neue Idee', 'halt die Idee fest', 'welche Ideen hab ich', 'Ideenliste', 'lass uns Idee X ausarbeiten', '/jb-ideas add|list|grill'."
argument-hint: "add <Idee> | list | grill <Nummer oder Slug>"
---

# Ideen-Backlog

Jan diktiert Ideen, oft unterwegs, und will sie nicht jedes Mal von Hand irgendwo eintragen lassen. Jede Idee ist eine eigene Notiz, bis sie ein Forgejo-Issue geworden ist. Dann wird die Notiz gelöscht, das Issue ist ab da die Quelle.

> **Vault-Zugriff:** nur über die `obsidian`-CLI, Vault `Notes`, Ordner `Ideas/`. Nie das Dateisystem durchsuchen. Schlägt `obsidian help` fehl, läuft Obsidian nicht: sag das und brich ab.

## Notizformat

Dateiname: `Ideas/{YYYY-MM-DD}-{slug}.md`. Datum aus `date +%F`, Slug aus dem Titel (klein, Bindestriche, 3 bis 5 Wörter).

```markdown
---
tags: [idee]
datum: {YYYY-MM-DD}
titel: {kurzer Titel}
repo: {owner/repo, falls klar, sonst leer lassen}
---

# {Titel}

{Die Idee in Jans Worten, bereinigt nach german-text.md. Kein Umformulieren über das Bereinigen hinaus.}

## Anmerkungen

{Nur wenn es etwas zu sagen gibt: Einwände, Zielkonflikte, offene Punkte zum Prüfen. Ehrlich und knapp, als Kollege. Nicht Erfundenes als Tatsache hinschreiben, Ungeprüftes als "zu prüfen" markieren.}
```

Notizen sind Deutsch. Kommt später etwas zur selben Idee dazu, ergänze die bestehende Notiz, statt eine neue anzulegen.

## Modus erkennen

Das erste Wort des Arguments entscheidet: `add`, `list` oder `grill`. Ohne Schlüsselwort: Enthält das Argument oder die Nachricht eine Idee, ist es `add`, sonst `list`.

### add

1. Prüfe mit `list`-Aufruf (s. u.), ob es schon eine Notiz zum selben Thema gibt. Wenn ja, ergänze sie.
2. Sonst lege die Notiz an:
   ```
   obsidian vault="Notes" create path="Ideas/{datei}.md" content="..."
   ```
3. Antworte in einem Satz mit dem Titel, plus die Anmerkungen, falls welche in der Notiz stehen. Keine Rückfrage, ob das so passt: Jan korrigiert, wenn nötig.

### list

```
obsidian vault="Notes" search:context query='/^titel: /' path="Ideas"
```

Liefert pro Notiz eine Zeile `Ideas/{datei}.md:4: titel: {Titel}`. Zeig die Ideen als nummerierte Liste, älteste zuerst, mit dem Titel aus der Property und dem Datum aus dem Dateinamen. Die Nummer gilt nur für diese Sitzung, `grill` darf sich darauf beziehen. Leerer Ordner: "Keine offenen Ideen."

### grill

1. Wähle die Idee per Nummer aus der letzten Liste oder per Slug. Fehlt beides, zeig die Liste und frag per `AskUserQuestion`.
2. Lies die Notiz: `obsidian vault="Notes" read path="Ideas/{datei}.md"`.
3. Kläre das Ziel-Repo, bevor das Interview anfängt: Steht `repo` in der Notiz, bestätigen lassen, sonst fragen. Ideen betreffen oft ein anderes Repo als das aktuelle Arbeitsverzeichnis.
4. Starte `jb-forgejo-issue-create` mit folgenden Abweichungen:
   - `owner`/`repo` aus Schritt 3 übergeben. Schritt 1 dort (Repo aus `git remote`) entfällt.
   - Den Notizinhalt als Ausgangskontext an `grill-me` geben, damit Jan nichts wiederholen muss.
   - Der Issue-Text ist **Englisch**, auch wenn Interview und Notiz Deutsch sind.
5. Erst wenn `create_issue` eine Issue-Nummer zurückgegeben hat, die Notiz löschen (landet im Papierkorb der Vault):
   ```
   obsidian vault="Notes" delete path="Ideas/{datei}.md"
   ```
   Nenne danach Issue-Nummer und URL.
6. Bricht Jan vor dem Issue ab, bleibt die Notiz. Hänge die Ergebnisse des Interviews unter `## Aus dem Interview` an, damit nichts verloren geht.
