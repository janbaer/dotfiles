---
name: ideas
description: "Ideen-Backlog in der Obsidian-Vault Notes: eine Idee festhalten, die offenen Ideen auflisten, eine Idee mit grill-me ausarbeiten und daraus ein Forgejo-Issue machen, oder eine Idee verwerfen. Trigger: 'ich hab eine Idee', 'neue Idee', 'halt die Idee fest', 'welche Ideen hab ich', 'Ideenliste', 'lass uns Idee X ausarbeiten', 'verwirf die Idee', 'die Idee ist Blödsinn', '/jb-ideas add|list|grill|drop'."
argument-hint: "add <Idee> | list | grill <Nummer oder Slug> | drop <Nummer oder Slug>"
---

# Ideen-Backlog

Jan diktiert Ideen, oft unterwegs, und will sie nicht jedes Mal von Hand irgendwo eintragen lassen. Jede Idee ist eine eigene Notiz, bis sie ein Forgejo-Issue geworden ist. Dann wird die Notiz archiviert, das Issue ist ab da die Quelle. Die Notiz bleibt als Historie erhalten.

> **Vault-Zugriff:** nur über die `obsidian`-CLI, Vault `Notes`, Ordner `Ideas/`. Nie das Dateisystem durchsuchen. Schlägt `obsidian help` fehl, läuft Obsidian nicht: sag das und brich ab.

## Status

Jede Notiz trägt die Property `status`: `offen`, `erledigt` (Issue angelegt) oder `verworfen`. Neue Notizen sind `offen`. `Ideas/` enthält nur offene Ideen, `Ideas/Archiv/` die erledigten und verworfenen. Jan sieht die Property in der Dateiliste nicht, deshalb zeigt ihm der Ordner, was noch offen ist: Status und Ordner immer gemeinsam ändern. Eine Notiz ohne `status` stammt von vor dieser Regel und gilt als `offen`.

## Notizformat

Dateiname: `Ideas/{YYYY-MM-DD}-{slug}.md`. Datum aus `date +%F`, Slug aus dem Titel (klein, Bindestriche, 3 bis 5 Wörter).

```markdown
---
tags: [idee]
datum: {YYYY-MM-DD}
titel: {kurzer Titel}
status: offen
repo: {owner/repo, falls klar, sonst leer lassen}
---

# {Titel}

{Die Idee aus Jans Diktat, bereinigt nach german-text.md und sprachlich geglättet: Diktat-Rahmen ("Ich habe eine Idee, die wir festhalten müssen") streichen, holprige Sätze straffen. Aussagen und Unsicherheiten bleiben, wie er sie gemacht hat ("glaube ich" nicht zur Tatsache machen).}

## Anmerkungen

{Nur wenn es etwas zu sagen gibt: Einwände, Zielkonflikte, offene Punkte zum Prüfen. Ehrlich und knapp, als Kollege. Nicht Erfundenes als Tatsache hinschreiben, Ungeprüftes als "zu prüfen" markieren.}
```

Notizen sind Deutsch. Kommt später etwas zur selben Idee dazu, ergänze die bestehende Notiz, statt eine neue anzulegen.

## Modus erkennen

Das erste Wort des Arguments entscheidet: `add`, `list`, `grill` oder `drop`. Ohne Schlüsselwort: Will Jan eine Idee verwerfen ("verwirf die Idee", "ist doch Blödsinn"), ist es `drop`. Enthält das Argument oder die Nachricht eine Idee, ist es `add`, sonst `list`.

### add

1. Prüfe mit `list`-Aufruf (s. u.), ob es schon eine Notiz zum selben Thema gibt. Wenn ja, ergänze sie.
2. Sonst lege die Notiz an:
   ```
   obsidian vault="Notes" create path="Ideas/{datei}.md" content="..."
   ```
3. Antworte in einem Satz mit dem Titel. Die Anmerkungen bleiben in der Notiz und kommen erst beim `grill` zur Sprache: im Chat laden sie zum Diskutieren ein, und genau das soll `add` nicht (siehe `idea-capture.md`). Keine Rückfrage, ob das so passt: Jan korrigiert, wenn nötig.

### list

```
obsidian vault="Notes" search:context query='/^titel: /' path="Ideas"
```

Liefert pro Notiz eine Zeile `Ideas/{datei}.md:4: titel: {Titel}`. Die Suche schließt Unterordner ein: Zeilen aus `Ideas/Archiv/` weglassen. Zeig die Ideen als nummerierte Liste, älteste zuerst, mit dem Titel aus der Property und dem Datum aus dem Dateinamen. Die Nummer gilt nur für diese Sitzung, `grill` darf sich darauf beziehen. Leerer Ordner: "Keine offenen Ideen."

### grill

1. Wähle die Idee per Nummer aus der letzten Liste oder per Slug. Fehlt beides, zeig die Liste und frag per `AskUserQuestion`.
2. Lies die Notiz: `obsidian vault="Notes" read path="Ideas/{datei}.md"`.
3. Kläre das Ziel-Repo, bevor das Interview anfängt: Steht `repo` in der Notiz, bestätigen lassen, sonst fragen. Ideen betreffen oft ein anderes Repo als das aktuelle Arbeitsverzeichnis.
4. Starte `jb-forgejo-issue-create` mit folgenden Abweichungen:
   - `owner`/`repo` aus Schritt 3 übergeben. Schritt 1 dort (Repo aus `git remote`) entfällt.
   - Den Notizinhalt als Ausgangskontext an `grill-me` geben, damit Jan nichts wiederholen muss.
   - Der Issue-Text ist **Englisch**, auch wenn Interview und Notiz Deutsch sind.
5. Erst wenn `create_issue` eine Issue-Nummer zurückgegeben hat, die Notiz archivieren, in dieser Reihenfolge:
   ```
   obsidian vault="Notes" property:set name="issue" value="{Issue-URL}" path="Ideas/{datei}.md"
   obsidian vault="Notes" property:set name="status" value="erledigt" path="Ideas/{datei}.md"
   obsidian vault="Notes" move path="Ideas/{datei}.md" to="Ideas/Archiv/{datei}.md"
   ```
   `move` legt fehlende Ordner nicht an (ENOENT); `Ideas/Archiv/` muss existieren. `move` kann außerdem still scheitern (Exit 0, keine Ausgabe, nichts verschoben). Prüfe mit `obsidian vault="Notes" files folder="Ideas/Archiv" ext=md`, dass die Datei angekommen ist. Wenn nicht, sag es: Status ist schon `erledigt`, nur das Verschieben fehlt.
   Nenne danach Issue-Nummer und URL.
6. Bricht Jan vor dem Issue ab, bleibt die Notiz. Hänge die Ergebnisse des Interviews unter `## Aus dem Interview` an, damit nichts verloren geht.

### drop

1. Wähle die Idee wie bei `grill`, Schritt 1.
2. Hat Jan einen Grund genannt, hänge ihn unter `## Verworfen` an die Notiz an, in seinen Worten. Ohne Grund nicht nachfragen.
3. Status setzen und archivieren:
   ```
   obsidian vault="Notes" property:set name="status" value="verworfen" path="Ideas/{datei}.md"
   obsidian vault="Notes" move path="Ideas/{datei}.md" to="Ideas/Archiv/{datei}.md"
   ```
   Ankunft prüfen wie bei `grill`, Schritt 5.
4. Bestätige in einem Satz mit dem Titel.
