---
name: ideas
description: "Ideen-Backlog in der Obsidian-Vault Notes: eine Idee festhalten, die offenen Ideen auflisten, eine Idee mit grill-me ausarbeiten und daraus ein Forgejo-Issue machen, oder eine Idee verwerfen, oder das Backlog auf erledigte und veraltete Ideen durchsehen. Trigger: 'ich hab eine Idee', 'neue Idee', 'halt die Idee fest', 'welche Ideen hab ich', 'Ideenliste', 'lass uns Idee X ausarbeiten', 'verwirf die Idee', 'die Idee ist Blödsinn', 'Ideen aufräumen', '/jb-ideas add|list|grill|drop|maintenance'."
argument-hint: "add <Idee> | list | grill <Nummer oder Slug> | drop <Nummer oder Slug> | maintenance"
---

# Ideen-Backlog

Jan diktiert Ideen, oft unterwegs, und will sie nicht jedes Mal von Hand irgendwo eintragen lassen. Jede Idee ist eine eigene Notiz, bis sie ein Forgejo-Issue geworden ist. Dann wird die Notiz archiviert, das Issue ist ab da die Quelle. Die Notiz bleibt als Historie erhalten.

> **Vault-Zugriff:** nur über die `obsidian`-CLI, Vault `Notes`, Ordner `Ideas/`. Nie das Dateisystem durchsuchen. Schlägt `obsidian help` fehl, läuft Obsidian nicht: sag das und brich ab.

## Status

Jede Notiz trägt die Property `status`: `open`, `done` (Issue angelegt) oder `dropped`. Neue Notizen sind `open`. `Ideas/` enthält nur offene Ideen, `Ideas/Archiv/` die erledigten und verworfenen. Jan sieht die Property in der Dateiliste nicht, deshalb zeigt ihm der Ordner, was noch offen ist: Status und Ordner immer gemeinsam ändern. Eine Notiz ohne `status` stammt von vor dieser Regel und gilt als `open`.

## Recherche durch Hermes

Ein Cron-Job auf dem Hermes-Server lässt offene Ideen vom Researcher vorrecherchieren (hermes-scripts#118). Er setzt `research` (`pending`, `done`, `unclear`, `failed`) und `research_attempts` und hängt bei `done` oder `unclear` den Abschnitt `## Recherche` an. `status` fasst er nie an. Diese beiden Properties und den Abschnitt schreibt nur Hermes; der Skill liest sie und entfernt sie höchstens.

## Notizformat

Dateiname: `Ideas/{YYYY-MM-DD}-{slug}.md`. Datum heute: !`date +%F` (steht dort ein Platzhalter, `date +%F` selbst ausführen), Slug aus dem Titel (klein, Bindestriche, 3 bis 5 Wörter).

```markdown
---
titel: {kurzer Titel}
repo: {owner/repo, falls klar, sonst leer lassen}
date: {YYYY-MM-DD}
status: open
tags:
  - idea
---

# {Titel}

{Die Idee aus Jans Diktat, bereinigt nach german-text.md und sprachlich geglättet: Diktat-Rahmen ("Ich habe eine Idee, die wir festhalten müssen") streichen, holprige Sätze straffen. Aussagen und Unsicherheiten bleiben, wie er sie gemacht hat ("glaube ich" nicht zur Tatsache machen).}

## Anmerkungen

{Nur wenn es etwas zu sagen gibt: Einwände, Zielkonflikte, offene Punkte zum Prüfen. Ehrlich und knapp, als Kollege. Nicht Erfundenes als Tatsache hinschreiben, Ungeprüftes als "zu prüfen" markieren.}
```

Notizen sind Deutsch. Kommt später etwas zur selben Idee dazu, ergänze die bestehende Notiz, statt eine neue anzulegen. Steht dort `research: unclear` oder `failed`, entferne danach `research` und `research_attempts` (`obsidian vault="Notes" property:remove name="research" path="Ideas/{datei}.md"`, ebenso für `research_attempts`), damit die geschärfte Idee neu recherchiert wird. Bei `pending` und `done` bleiben beide stehen.

## Modus erkennen

Das erste Wort des Arguments entscheidet: `add`, `list`, `grill`, `drop` oder `maintenance`. Ohne Schlüsselwort: Will Jan eine Idee verwerfen ("verwirf die Idee", "ist doch Blödsinn"), ist es `drop`. Enthält das Argument oder die Nachricht eine Idee, ist es `add`, sonst `list`.

### add

1. Prüfe mit `list`-Aufruf (s. u.), ob es schon eine Notiz zum selben Thema gibt. Wenn ja, lies sie und frag per `AskUserQuestion` (mit Titel und Datum): ergänzen, neu anlegen, oder die alte per `drop` ersetzen. Die alte Notiz kann überholt sein.
2. Sonst lege die Notiz mit dem Skript an. Titel und bereinigten Text übergibst du fertig, Dateiname, Datum und Frontmatter setzt das Skript:
   ```
   ~/Projects/dotfiles/.claude/skills/jb-ideas/scripts/ideas.sh add "{Titel}" "{Text}"
   ```
   Anmerkungen und `repo` ergänzt du danach in der Notiz. Das Skript teilt sich der Mod `ideas-pane` mit diesem Skill.
3. Antworte in einem Satz mit dem Titel. Die Anmerkungen bleiben in der Notiz und kommen erst beim `grill` zur Sprache: im Chat laden sie zum Diskutieren ein, und genau das soll `add` nicht (siehe `idea-capture.md`). Keine Rückfrage, ob das so passt: Jan korrigiert, wenn nötig.

### list

```
~/Projects/dotfiles/.claude/skills/jb-ideas/scripts/ideas.sh list
```

Liefert pro offener Idee eine Zeile `{datei ohne .md}<TAB>{Datum}<TAB>{Titel}`, bereits ohne `Ideas/Archiv/` und älteste zuerst. Zeig die Ideen als nummerierte Liste, älteste zuerst, mit dem Titel aus der Property und dem Datum aus dem Dateinamen. Die Nummer gilt nur für diese Sitzung, `grill` darf sich darauf beziehen. Leerer Ordner: "Keine offenen Ideen."

### grill

1. Wähle die Idee per Nummer aus der letzten Liste oder per Slug. Fehlt beides, zeig die Liste und frag per `AskUserQuestion`.
2. Lies die Notiz: `obsidian vault="Notes" read path="Ideas/{datei}.md"`.
3. Kläre das Ziel-Repo, bevor das Interview anfängt: Steht `repo` in der Notiz, bestätigen lassen, sonst fragen. Ideen betreffen oft ein anderes Repo als das aktuelle Arbeitsverzeichnis.
   Sag Jan dabei in einem Satz, wie es um die Recherche steht: `done` (liegt vor), `unclear` (Ziel unklar, mit dem, was fehlt), `pending` (läuft gerade, Ergebnis kommt evtl. später), `failed` oder keine Property (keine Recherche). Bei `pending` nicht warten.
4. Starte `jb-forgejo-issue-create` mit folgenden Abweichungen:
   - `owner`/`repo` aus Schritt 3 übergeben. Schritt 1 dort (Repo aus `git remote`) entfällt.
   - Den Notizinhalt als Ausgangskontext an `grill-me` geben, damit Jan nichts wiederholen muss. Gibt es `## Recherche`, ist sie Teil davon: Was sie schon beantwortet, fragt `grill-me` nicht neu ab, sondern lässt es bestätigen. Ihre Quellen sind ungeprüfte Modellausgabe und gehen nur nach einer Prüfung als Fakt ins Issue. Bei `unclear` beginnt das Interview mit den Punkten, die die Recherche als fehlend nennt.
   - Der Issue-Text ist **Englisch**, auch wenn Interview und Notiz Deutsch sind.
5. Erst wenn `create_issue` eine Issue-Nummer zurückgegeben hat, die Notiz archivieren, in dieser Reihenfolge:
   ```
   obsidian vault="Notes" property:set name="issue" value="{Issue-URL}" path="Ideas/{datei}.md"
   obsidian vault="Notes" property:set name="status" value="done" path="Ideas/{datei}.md"
   obsidian vault="Notes" move path="Ideas/{datei}.md" to="Ideas/Archiv/{datei}.md"
   ```
   `move` legt fehlende Ordner nicht an (ENOENT); `Ideas/Archiv/` muss existieren. `move` kann außerdem still scheitern (Exit 0, keine Ausgabe, nichts verschoben). Prüfe mit `obsidian vault="Notes" files folder="Ideas/Archiv" ext=md`, dass die Datei angekommen ist. Wenn nicht, sag es: Status ist schon `done`, nur das Verschieben fehlt.
   Nenne danach Issue-Nummer und URL.
6. Bricht Jan vor dem Issue ab, bleibt die Notiz. Hänge die Ergebnisse des Interviews unter `## Aus dem Interview` an, damit nichts verloren geht.

### drop

1. Wähle die Idee wie bei `grill`, Schritt 1.
2. Hat Jan einen Grund genannt, hänge ihn unter `## Verworfen` an die Notiz an, in seinen Worten. Ohne Grund nicht nachfragen.
3. Status setzen und archivieren:
   ```
   obsidian vault="Notes" property:set name="status" value="dropped" path="Ideas/{datei}.md"
   obsidian vault="Notes" move path="Ideas/{datei}.md" to="Ideas/Archiv/{datei}.md"
   ```
   Ankunft prüfen wie bei `grill`, Schritt 5.
4. Bestätige in einem Satz mit dem Titel.

### maintenance

Nur das Argument `maintenance`, nie als Idee-Text zu verstehen. Der Modus ist **nur lesend**: Er schlägt Archiv-Kandidaten vor und ändert nichts.

1. Hole die offenen Ideen mit `ideas.sh list`. Für jede: Notiz lesen, `repo` und `date` aus dem Frontmatter nehmen. Heute per `date +%F`, daraus das Alter in Tagen.
2. Ordne jede Idee ein:
   - **Erledigt:** Die Idee ist belegbar umgesetzt oder anderweitig abgedeckt. Prüfe nur lesend an der Live-Quelle: Es gibt schon ein Forgejo-Issue oder einen PR dazu (Suche im `repo`, sonst nach dem Titel), die Funktion steckt bereits im Repo, eine andere offene Idee oder ein Skill deckt dasselbe ab. Nenne den Beleg.
   - **Wahrscheinlich veraltet:** Älter als 14 Tage und kein Hinweis in die eine oder andere Richtung.
   - **Behalten:** Jünger als 14 Tage, oder ein Hinweis, dass die Idee noch gilt. Beleg schlägt Alter.
3. Zeig nur Erledigte und Wahrscheinlich veraltete, Erledigte zuerst, als Tabelle mit fortlaufender Nummer in der ersten Spalte (`#`, 1, 2, 3 … über beide Kategorien), dann Datei, Titel, Alter in Tagen, Kategorie, Grund in einer Zeile. Darunter die Zahl der behaltenen Ideen. Keine Kandidaten: "Keine Kandidaten."
4. Hier ist Schluss. Archiviert wird nur, wenn Jan Ideen nennt (Nummer oder Slug). Dann läuft pro Idee `drop`, Schritt 3. Wurde die Idee in der Praxis umgesetzt und Jan will das festhalten, setzt du stattdessen `status` auf `done`.
