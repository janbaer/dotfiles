---
name: diary-daily-entry
description: "Wenn der Nutzer einen neuen Tagebucheintrag in Obsidian schreiben will oder Dinge sagt wie 'Tagebuch', 'Tageseintrag', 'diary entry', 'Eintrag für heute', 'daily note', 'Wie war gestern', 'Morgenreflexion'. Führt ein kurzes Interview auf Deutsch und hängt den Eintrag an den aktuellen Wochenbericht in der Obsidian-Vault `Notes` an. Unbedingt verwenden, sobald es um das tägliche Tagebuch geht — auch wenn der Nutzer das Wort 'Tagebuch' nicht explizit benutzt, sondern z. B. sagt 'ich möchte kurz reflektieren', 'lass uns über gestern sprechen' oder 'was nehme ich mir heute vor'."
---

# Täglicher Tagebucheintrag

Du führst ein kurzes Reflexionsgespräch mit Jan und schreibst das Ergebnis als Prosa in seinen Wochenbericht. Das Interview und der Eintrag sind immer auf **Deutsch**. Der geschriebene Text soll zu Jans bestehendem Schreibstil passen: fließender Fließtext, kein bürokratisches Bullet-Listen-Deutsch.

## Kontext

Jan schreibt seine Tageseinträge meistens morgens, kurz nach dem Aufstehen, und reflektiert dabei über den Vortag. Es gibt **keine** separaten Tagesdateien — alle Einträge einer Woche landen als Abschnitte im gleichen Wochenbericht:

- **Vault:** `Notes`
- **Datei:** `Weekly/Wochenbericht KW NN.md` (aktuelle ISO-Kalenderwoche)
- **Abschnitt:** `## {deutscher Wochentag}` — **immer der heutige Wochentag**, auch wenn der Inhalt sich auf gestern bezieht

## Vor dem Gespräch

### 1. Datum und Woche bestimmen

Ermittle per Bash:

```bash
date +%V           # ISO-Kalenderwoche, z. B. 16
LC_TIME=de_DE.UTF-8 date +%A   # Deutscher Wochentag, z. B. Sonntag
```

Falls das Locale nicht verfügbar ist, verwende diese Zuordnung manuell (Mon=Montag, Tue=Dienstag, Wed=Mittwoch, Thu=Donnerstag, Fri=Freitag, Sat=Samstag, Sun=Sonntag).

### 2. Wochenbericht lesen

Verwende den `obsidian`-Skill mit der Vault `Notes`:

```bash
obsidian vault="Notes" read file="Weekly/Wochenbericht KW NN"
```

Daraus folgt:

- **Datei existiert nicht** → später mit `obsidian create` neu anlegen. Kein Panik-Abbruch.
- **Datei existiert, heutiger Wochentag-Abschnitt fehlt** → neuen Abschnitt anhängen.
- **Datei existiert, heutiger Abschnitt existiert schon** → der neue Text wird als Update an den bestehenden Abschnitt angehängt und mit `**Update:**` (in Englisch, genau so) eingeleitet. Jan macht das bewusst, weil er im Laufe des Tages nachtragen will.

Lies zusätzlich den Abschnitt des Vortags (falls vorhanden), um im Gespräch konkret Bezug nehmen zu können statt generische Fragen zu stellen.

## Schnellmodus: Update ohne Interview

Wenn Jans Nachricht mit `update:` beginnt (Kleinschreibung, mit Doppelpunkt), überspring das komplette Interview. Jan hat den Text schon selbst formuliert und will ihn nur eingetragen haben.

Vorgehen:

1. Entferne das `update:`-Präfix aus Jans Nachricht.
2. Wende die Textpflege (siehe unten, `german-text.md`) auf den übrigen Text an.
3. Schreibe in den Wochenbericht:
   - **Heutiger Abschnitt existiert schon** → hänge den bereinigten Text unter dem Abschnitt an, eingeleitet mit `**update:**` (Englisch, genau so), z. B.: `\n\n**update:** {bereinigter Text}\n`.
   - **Heutiger Abschnitt existiert noch nicht** → lege `## {Wochentag}` neu an und füge den bereinigten Text direkt darunter ein — ohne `**update:**`-Präfix, denn es ist der erste Eintrag des Tages.
4. Kurze Rückmeldung: in welche Datei und unter welchen Abschnitt geschrieben wurde. Keine Fragen, keine Nachhaken.

Das `update:`-Signal ist bewusst — Jan hat keine Lust auf Interview und will einfach tippen.

## Das Gespräch

Stelle die Fragen **einzeln**, eine nach der anderen. Warte jeweils auf die Antwort. Drei bis fünf Fragen, in dieser Reihenfolge:

### 1. Heute oder gestern?

Frage: **"Geht es heute um gestern oder um heute?"**

Das steuert nur die Zeitform im geschriebenen Text — die Einordnung in die Datei bleibt unberührt (immer heutiger Wochentag).

### 2. Was lief gut?

Frage: **"Was lief gut?"**

Wenn aus dem Vortags-Abschnitt schon etwas Positives hervorgeht, das Jan nicht nennt, sprich es kurz an. Jan neigt dazu, sich auf Probleme zu fokussieren — hilf ihm, die guten Dinge bewusst zu machen.

### 3. Was lief nicht so gut?

Frage: **"Was lief nicht so gut oder hat dich geärgert?"**

Ehrlich, nicht verurteilend. Wenn du Muster siehst (z. B. dasselbe Ärgernis taucht mehrfach auf), nenne es beiläufig, aber mach keine Therapie draus.

### 4. Ziele für heute

Frage: **"Was nimmst du dir für heute vor?"**

Diese Antworten werden später als Obsidian-Tasks (`- [ ]`) in den Eintrag eingefügt, damit Jan sie abhaken kann. Frage konkret nach, wenn etwas zu schwammig ist ("heute produktiv sein" → was heißt das?).

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

**update:** {fließender Text mit den neuen Antworten}

{Falls neue Ziele genannt wurden, als zusätzliche `- [ ]`-Tasks unter dem bestehenden Ziele-Block oder — falls keiner da ist — als neuer kleiner Block.}
```

### Textpflege vor dem Schreiben

Bevor der Eintrag nach Obsidian geht, die allgemeine Textkorrektur aus `.claude/rules/german-text.md` anwenden: Umlaute aus `ae`/`oe`/`ue` herstellen, `ss`/`ß` kontextgerecht, Tippfehler und Grammatik still korrigieren, Jans Stimme bewahren.

### Schreiben in Obsidian

1. **Datei existiert nicht:**
   ```bash
   obsidian vault="Notes" create name="Weekly/Wochenbericht KW NN" template="page" silent
   ```
   Danach den Eintrag mit `obsidian append` anhängen.

2. **Datei existiert:**
   ```bash
   obsidian vault="Notes" append file="Weekly/Wochenbericht KW NN" content="..."
   ```

Der `append`-Befehl fügt am Dateiende an — genau richtig, wenn die Wochentage chronologisch aufsteigend sind und der heutige Abschnitt neu ist. Für das Update in einen bereits existierenden Abschnitt fügt `append` am Dateiende an; das ist akzeptabel, weil der Update-Block direkt unter dem letzten Inhalt des Tages landet und durch den `**update:**`-Präfix klar erkennbar ist.

## Regeln

1. **Alles auf Deutsch** — außer dem `**update:**`-Präfix, der bewusst Englisch bleibt.
2. **Fließtext, keine Bullets** — außer bei den Tages-Zielen (die sind Tasks).
3. **Heutiger Wochentag ist heutiger Wochentag** — auch wenn der Inhalt sich auf gestern bezieht. Nicht verwechseln.
4. **Eine Frage nach der anderen** — nicht alle gleichzeitig stellen.
5. **Konkret statt generisch** — beziehe dich auf den Vortags-Abschnitt, wenn Jan Bezüge verpasst.
6. **Ziele sind Tasks** — `- [ ]` damit Jan sie abhaken kann.
7. **Kein Umschreiben vorhandener Einträge** — nur anhängen, nie überschreiben.
8. **Stilnähe über Vollständigkeit** — lieber einen kurzen, stimmigen Eintrag als eine durchformulierte Gliederung, die nicht nach Jan klingt.
