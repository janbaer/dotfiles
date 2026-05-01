---
name: diary-daily-entry
description: "Wenn der Nutzer einen neuen Tagebucheintrag in Obsidian schreiben will oder Dinge sagt wie 'Tagebuch', 'Tageseintrag', 'diary entry', 'Eintrag für heute', 'daily note', 'Wie war gestern', 'Morgenreflexion'. Führt ein kurzes Interview auf Deutsch und hängt den Eintrag an den aktuellen Wochenbericht in der Obsidian-Vault `Notes` an. Unbedingt verwenden, sobald es um das tägliche Tagebuch geht — auch wenn der Nutzer das Wort 'Tagebuch' nicht explizit benutzt, sondern z. B. sagt 'ich möchte kurz reflektieren', 'lass uns über gestern sprechen' oder 'was nehme ich mir heute vor'."
---

# Täglicher Tagebucheintrag

Du führst ein kurzes Reflexionsgespräch mit Jan und schreibst das Ergebnis als Prosa in seinen Wochenbericht. Das Interview und der Eintrag sind immer auf **Deutsch**. Der geschriebene Text soll zu Jans bestehendem Schreibstil passen: fließender Fließtext, kein bürokratisches Bullet-Listen-Deutsch.

## Kontext

Jan schreibt seine Tageseinträge meistens morgens, kurz nach dem Aufstehen, und reflektiert dabei über den Vortag. Es gibt **keine** separaten Tagesdateien — alle Einträge einer Woche landen als Abschnitte im gleichen Wochenbericht:

- **Vault:** `Notes`
- **Dateipfad auf der Platte:** `/mnt/zb-data/webdav/data/Notes/Weekly/Wochenbericht KW NN.md` (aktuelle ISO-Kalenderwoche)
- **Abschnitt:** `## {deutscher Wochentag}` — **immer der heutige Wochentag**, auch wenn der Inhalt sich auf gestern bezieht

Der Wochenbericht ist eine reine Markdown-Datei mit YAML-Frontmatter. Das heißt: alle Operationen (lesen, schreiben, anhängen, Todos abhaken) gehen direkt über `Read`, `Write` und `Edit` — kein Bedarf für die `obsidian`-CLI. Obsidian selbst pickt die Änderungen automatisch auf, sobald die Datei modifiziert wird.

## Vor dem Gespräch

### 1. Datum und Woche bestimmen

Ermittle per Bash:

```bash
date +%V           # ISO-Kalenderwoche, z. B. 16
LC_TIME=de_DE.UTF-8 date +%A   # Deutscher Wochentag, z. B. Sonntag
```

Falls das Locale nicht verfügbar ist, verwende diese Zuordnung manuell (Mon=Montag, Tue=Dienstag, Wed=Mittwoch, Thu=Donnerstag, Fri=Freitag, Sat=Samstag, Sun=Sonntag).

### 2. Wochenbericht lesen

Lies die Datei (Pfad siehe Kontext) mit dem `Read` tool. Drei Fälle:

- **Datei existiert nicht** → später mit `Write` tool neu anlegen (siehe "Schreiben"). Kein Panik-Abbruch.
- **Datei existiert, heutiger Wochentag-Abschnitt fehlt** → später neuen Abschnitt anhängen.
- **Datei existiert, heutiger Abschnitt existiert schon** → der neue Text wird als Update an den bestehenden Abschnitt angehängt und mit `**Update:**` (Englisch, großes U) eingeleitet. Jan macht das bewusst, weil er im Laufe des Tages nachtragen will.

Im selben `Read`-Aufruf hast du auch den Vortagsabschnitt (falls vorhanden) — nutze ihn, um im Gespräch konkret Bezug zu nehmen statt generische Fragen zu stellen, und merk dir die offenen Todos vom Vortag (`- [ ]`) — die werden später abgehakt.

### 3. Vikunja-Check im Hintergrund starten

Starte den Vikunja-Check **im Hintergrund**, damit das Interview sofort losgehen kann. Sinn der Sache: Jan trägt Termine und Wartungs-Todos in Vikunja ein und vergisst sie zwischen Tagebuch-Sessions — wenn sie morgens automatisch in den Tages-Ziele-Block wandern, kann er sie über das Tagebuch abhaken. Den Check parallel zum Interview laufen zu lassen spart spürbar Wartezeit am Morgen.

Vorgehen: Rufe per `Agent` tool den Subagent `vikunja-agent` mit `run_in_background: true` auf:

- `subagent_type`: `vikunja-agent`
- `description`: kurz, z. B. „Vikunja-Tasks heute/überfällig"
- `prompt`: `Operation: list-due-today-or-overdue. Heutige fällige und überfällige Tasks als Markdown-Liste zurückgeben (oder 'keine'), wie in der Agent-Doku.`
- `run_in_background`: `true`

Der Agent retourniert eine Markdown-Liste mit Titeln (oder das Wort `keine`). Bis du Frage 4 erreichst, ist die Notification mit dem Ergebnis typischerweise da — der Agent macht 5–6 MCP-Calls auf Haiku, das dauert grob 5–10 Sekunden, und dazwischen liegen mindestens zwei Q&A-Turns.

**Fehlerfall:** Wenn der Agent eine `⚠️ Vikunja-Server nicht erreichbar`-Antwort liefert, gib einmalig eine kurze Notiz im Chat aus:

> ⚠️ Vikunja-Server gerade nicht erreichbar — ich überspringe den Task-Check und mach mit dem Tagebuch weiter.

Dann ohne Vikunja-Liste fortfahren. Der Tagebucheintrag ist wichtiger als der Task-Check, und Jan soll den Ausfall mitbekommen — aber abbrechen tut die Skill nicht.

## Schnellmodus: Update ohne Interview

Wenn Jans Nachricht mit `Update:` beginnt (großes U, mit Doppelpunkt), überspring das komplette Interview **und auch den Vikunja-Task-Check (Schritt 3)**. Jan hat den Text schon selbst formuliert und will ihn nur als Nachtrag zu einem bestehenden Eintrag eingetragen haben — ein neuer Tagesplan steht nicht an.

Vorgehen:

1. Entferne das `Update:`-Präfix aus Jans Nachricht.
2. Wende die Textpflege (Umlaute, Grammatik, Tippfehler) auf den übrigen Text an.
3. Schreibe in den Wochenbericht:
   - **Heutiger Abschnitt existiert schon** → hänge den bereinigten Text unter dem Abschnitt an, eingeleitet mit `**Update:**` (Englisch, großes U, genau so), z. B.: `\n\n**Update:** {bereinigter Text}\n`.
   - **Heutiger Abschnitt existiert noch nicht** → lege `## {Wochentag}` neu an und füge den bereinigten Text direkt darunter ein — ohne `**Update:**`-Präfix, denn es ist der erste Eintrag des Tages.
4. Danach: Todos abhaken (mit `Edit` tool).
5. Kurze Rückmeldung: in welche Datei und unter welchen Abschnitt geschrieben wurde. Keine Fragen, keine Nachhaken.

Das `Update:`-Signal ist bewusst — das Interview zum Vortag ist bereits gelaufen. Jan trägt jetzt nur noch eine zusätzliche Information nach, die später am Tag eingefallen ist.

**Wichtig:** Wenn Jan einen neuen Eintrag schreibt (ohne `Update:`-Präfix), führe immer die vier Interview-Fragen durch, auch wenn Jan den Text schon selbst formuliert hat. Das hilft beim Strukturieren und Gewichten.

## Das Gespräch

Stelle die Fragen **einzeln**, eine nach der anderen. Warte jeweils auf die Antwort. Drei bis fünf Fragen, in dieser Reihenfolge:

### 1. Heute oder gestern?

Ermittle per Bash die aktuelle Stunde:

```bash
date +%H
```

Verwende `AskUserQuestion` mit einer Single-Select-Auswahl. Stelle die Optionen so zusammen:
- Vor 10 Uhr: Optionen `["Gestern", "Heute"]` — Gestern ist die erste und damit vorausgewählte Option.
- Ab 10 Uhr: Optionen `["Heute", "Gestern"]` — Heute ist die erste und damit vorausgewählte Option.

Das steuert nur die Zeitform im geschriebenen Text — die Einordnung in die Datei bleibt unberührt (immer heutiger Wochentag).

### 2. Was lief gut?

Frage: **"Was lief gut?"**

Wenn aus dem Vortags-Abschnitt schon etwas Positives hervorgeht, das Jan nicht nennt, sprich es kurz an. Jan neigt dazu, sich auf Probleme zu fokussieren — hilf ihm, die guten Dinge bewusst zu machen.

### 3. Was lief nicht so gut?

Frage: **"Was lief nicht so gut oder hat dich geärgert?"**

Ehrlich, nicht verurteilend. Wenn du Muster siehst (z. B. dasselbe Ärgernis taucht mehrfach auf), nenne es beiläufig, aber mach keine Therapie draus.

### 4. Ziele für heute

**Vor der Frage:** Hol das Ergebnis des Hintergrund-Agents aus Schritt 3 ab.

- **Notification kam schon an** (Regelfall) → du kennst die Liste.
- **Agent läuft noch** → kurz warten, bis die Notification eintrifft. Sollte selten vorkommen; falls doch und der Agent merklich hängt, ohne Liste weitermachen und das im Chat erwähnen.
- **Agent hat eine `⚠️`-Meldung geliefert** → kein zweiter Hinweis, der wurde in Schritt 3 schon abgegeben. Einfach ohne Liste weiter.

Wenn die Liste **Treffer enthält** (also nicht `keine`), erwähne sie kurz vor der Frage, damit Jan sieht, was sowieso schon ansteht. Beispiel:

> Bevor wir zu deinen Tageszielen kommen: in Vikunja stehen heute drei offene/überfällige Tasks — *„Heizungsrechnung bezahlen"*, *„Backup Hermes-agent konfigurieren"*, *„Mailbox-Vertrag reduzieren"*. Die nehm ich automatisch in deine Ziele auf.

Dann die Frage: **"Was nimmst du dir darüber hinaus für heute vor?"**

Wenn die Liste leer ist (`keine`) oder nicht verfügbar, einfach die Standardvariante: **"Was nimmst du dir für heute vor?"**

Jans Antworten **plus** die Vikunja-Tasks landen später als Obsidian-Tasks (`- [ ]`) im Eintrag — Jans eigene Ziele zuerst, danach die Vikunja-Einträge mit reinem Titel (kein Projekt-Präfix, keine Markierung als „aus Vikunja"). Frage konkret nach, wenn Jans eigene Antwort zu schwammig ist ("heute produktiv sein" → was heißt das?).

### 5. Sonst noch was?

Frage: **"Sonst noch was auf dem Herzen?"**

Freitext-Raum für alles, was nicht in die Schubladen oben passt — Träume, Beobachtungen, spontane Gedanken, geplante Treffen. Jan schreibt sowas gerne und es gehört zum Tagebuch-Charakter.

## Den Eintrag schreiben

Formuliere aus den Antworten einen **zusammenhängenden Fließtext** in Jans Stil. Beobachtungen zu seinem Stil:

- Beginnt oft mit einer Begrüßung wie *"Guten Morgen"* oder *"Es ist leider zu spät, um noch guten Morgen zu sagen"*.
- Wechselt locker zwischen Vortag-Rückblick und Tagesplanung.
- Persönlich, ich-erzählend, kein Business-Deutsch.
- Emojis sparsam (😜 kommt vor, aber selten).
- Kein „Dear Diary"-Pathos, eher nüchterne Reflexion.

**Struktur des Eintrags:**

```markdown

## {Wochentag}

{Begrüßung + fließender Text, der was gut lief und was nicht integriert —
je nach Antwort auf Frage 1 im Tempus passend: "Gestern habe ich…" vs. "Heute früh…"}

{Falls „Sonst noch was" Inhalt hat: nahtlos einweben, nicht als separater Abschnitt.}

**Ziele für heute:**
- [ ] Ziel 1
- [ ] Ziel 2
- [ ] Ziel 3
```

**Wenn der Abschnitt für heute schon existiert** (Update-Fall), verwende stattdessen:

```markdown

**Update:** {fließender Text mit den neuen Antworten}

{Falls neue Ziele genannt wurden, als zusätzliche `- [ ]`-Tasks unter dem bestehenden Ziele-Block oder — falls keiner da ist — als neuer kleiner Block.}
```

### Textpflege

Bevor der Eintrag rausgeht:

1. **Korrekturen** laut `german-text.md`: Umlaute aus `ae`/`oe`/`ue` herstellen, `ss`/`ß` kontextgerecht, Tippfehler und Grammatik still korrigieren.
2. **Leichte stilistische Überarbeitung** erlaubt: Sätze flüssiger machen, holprige Formulierungen glätten, Wiederholungen entfernen — solange Sinn und Jans Stimme erhalten bleiben. Keine inhaltlichen Änderungen, keine fremden Formulierungen, die nicht nach Jan klingen.

### Entwurf zeigen und bestätigen lassen

Gib den Eintrag erst im Chat aus — vollständig, als Markdown-Codeblock — und frag kurz, ob er so passt. Erst wenn Jan bestätigt, in die Datei schreiben. Das kostet nichts und vermeidet, dass eine schiefe Formulierung gleich auf der Platte landet.

### In die Datei schreiben

1. **Datei existiert nicht** (z. B. erster Tagebucheintrag der Woche):
   Verwende `Write` mit folgendem Grundgerüst:
   ```markdown
   ---
   created: YYYY-MM-DD
   tags: []
   ---

   ## {Wochentag}

   {Eintrag}
   ```

2. **Datei existiert** (Regelfall — Eintrag für einen weiteren Wochentag oder Update):
   - Du hast die Datei in Schritt 2 schon eingelesen.
   - Nutze `Edit`, um den neuen Block am Dateiende anzufügen. Als Anker-String die letzte Zeile (oder die letzten 2–3 Zeilen) der Datei nehmen.

**Wichtig zu `Edit`:** Der `old_string` muss in der Datei eindeutig sein. Häufige Anker (`**Ziele für heute:**`) tauchen mehrfach auf — pack daher genug Kontext drumherum, dass die Stelle eindeutig matcht.

### Vortags-Todos abhaken

Nach dem Schreiben des neuen Eintrags die Todos aus dem Vortagsabschnitt abhaken — aber nur die, die Jan im Interview als erledigt bestätigt hat:

- Ersetze `- [ ] {text}` durch `- [x] {text} ✅ {YYYY-MM-DD}` per `Edit` tool
- Datum = das Datum des **Vortags**, nicht heute
- Nicht erledigte Todos unangetastet lassen

## Regeln

1. **Alles auf Deutsch** — außer dem `**Update:**`-Präfix, der bewusst Englisch bleibt.
2. **Fließtext, keine Bullets** — außer bei den Tages-Zielen (die sind Tasks).
3. **Heutiger Wochentag ist heutiger Wochentag** — auch wenn der Inhalt sich auf gestern bezieht. Nicht verwechseln.
4. **Eine Frage nach der anderen** — nicht alle gleichzeitig stellen.
5. **Konkret statt generisch** — beziehe dich auf den Vortags-Abschnitt, wenn Jan Bezüge verpasst.
6. **Ziele sind Tasks** — `- [ ]` damit Jan sie abhaken kann.
7. **Kein Umschreiben vorhandener Einträge** — nur anhängen, nie überschreiben.
8. **Stilnähe über Vollständigkeit** — lieber einen kurzen, stimmigen Eintrag als eine durchformulierte Gliederung, die nicht nach Jan klingt.
