---
name: wochenplan
description: "Ändert den Auszeit-Wochenplan in der Obsidian-Notiz Auszeit-Plan.plan.md (Details je Tag zu Weiterbildung, Homelab, Haushalt, Anlass) und baut auf Wunsch das druckbare PDF neu. Trigger: 'Wochenplan', 'Plan ändern', 'was mache ich morgen', 'Tagesplan anpassen', 'PDF neu', '/wochenplan'."
---

# Wochenplan ändern

Quelle ist `~/Documents/Notes/Auszeit-Plan.plan.md`. Das Frontmatter hat `weeks:`, pro Woche `week`, `theme` und sieben `days` mit `name` und `date`. Montag bis Freitag tragen `weiterbildung`, `homelab`, `haushalt`, `anlass`, `sonstiges` als Freitext, Samstag und Sonntag nur `notiz`. Der Fließtext unter dem Frontmatter bleibt unberührt.

## Ablauf

1. **Datum:** `date` ausführen, nie aus dem Kontext raten. Tage und Kalenderwochen über `date -d <Datum> +"%F %A KW%V"` auflösen.
2. **Tag wählen** (`AskUserQuestion`): Heute, Morgen (jeweils mit Wochentag und Datum), oder ein anderer Tag über "Other".
3. **Eintrag suchen:** Die Woche (KW) und den Tag in `weeks` suchen. Fehlt die Woche, nach dem Wochenthema fragen (Vorschlag: das der Vorwoche) und die Woche anlegen: sieben Tage mit Namen und Datum, alle Textfelder als `""`. Als Vorlage dient eine vorhandene Woche in der Notiz.
4. **Blöcke wählen** (`AskUserQuestion`, Mehrfachauswahl): Weiterbildung, Homelab, Haushalt, Anlass, Sonstiges. Bei Samstag und Sonntag nur die Notiz. Den aktuellen Text je Block in der Beschreibung zeigen.
5. **Inhalt je Block** einzeln erfragen, mit Vorschlägen als Antwortoptionen und "Other" für freien Text:
   - Weiterbildung: das Lernprojekt des Monats (`~/Projects/learnings`, Monatszuordnung steht im Fließtext der Notiz).
   - Homelab: offene Einträge aus `~/Documents/Notes/Ideas/` (Titel lesen).
   - Haushalt, Anlass und Sonstiges: ohne Vorschläge, freie Eingabe.
   Der Text bleibt kurz, ein bis zwei Sätze, höchstens etwa 150 Zeichen (Notiz am Wochenende etwa 40). Längeres wird im PDF abgeschnitten (`clip: true` in `plans/plan.typ`), also kürzen oder Jan darauf hinweisen.
6. **Schreiben:** Nur die geänderten Felder im Frontmatter ersetzen (`Edit`). Deutsch mit echten Umlauten, YAML-Strings in Anführungszeichen.
7. **Zusammenfassung** der Änderungen zeigen, dann fragen, ob weitere Tage oder Blöcke dran sind (zurück zu Schritt 2) oder ob das PDF aktualisiert werden soll.
8. **PDF bauen**, wenn ja:
   ```bash
   cd "$HOME/Projects/zettelkasten" && direnv exec . make FILE="$HOME/Documents/Notes/Auszeit-Plan.plan.md" WEEK=<KW>
   ```
   `WEEK` immer setzen: ohne den Parameter baut das Makefile die aktuelle Kalenderwoche, auch wenn eine andere Woche geändert wurde, und das PDF enthält dann die Änderungen nicht. Die geänderte Woche nehmen, bei mehreren fragen, welche gerendert werden soll, und die gewählte KW nennen. Den Exit-Code prüfen, nicht die Datei: nach einem Fehlschlag kann ein altes PDF noch daliegen. Pfad `~/Projects/zettelkasten/plans/Auszeit-Plan.pdf` melden, Fehlermeldungen unverändert zeigen.
