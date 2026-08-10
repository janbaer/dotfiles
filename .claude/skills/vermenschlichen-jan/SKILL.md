---
name: vermenschlichen-jan
description: "Jans Ergänzung zum vermenschlichen-Skill. Verwenden, sobald ein deutscher Text auf KI-Spuren geprüft oder entschärft werden soll: 'klingt das nach KI', 'lies den Text gegen', 'entschärfe die KI-Spuren', oder wenn ein deutscher Blogartikel, eine Notiz oder ein Dokument vermenschlicht werden soll. Immer zusammen mit vermenschlichen anwenden, nie allein. Für englische Texte stattdessen humanizer."
---

# vermenschlichen: Jans Regeln obendrauf

Der `vermenschlichen`-Skill deckt die deutschen KI-Muster breit ab. Was dort fehlt oder für Jans Texte anders eingestellt gehört, steht hier. Diese Datei ersetzt ihn nicht, sie kommt danach.

Der Basis-Skill ist nicht von Jan und liegt in der `.gitignore`. Dort **nichts ändern**, Änderungen sind beim nächsten Neuinstallieren weg. Genau dafür gibt es diese Datei.

**Benötigt wird genau dieser Skill: https://github.com/LOGIN-TB/claude-skills/blob/main/skills/vermenschlichen/SKILL.md**

Fehlt er auf dieser Maschine, sag das und arbeite nicht ersatzweise nur mit dieser Datei. Die Ergänzungen ohne die Basismuster sind keine Prüfung, sondern eine halbe. Nachinstallieren:

```bash
mkdir -p ~/Projects/dotfiles/.claude/skills/vermenschlichen
curl -fsSL -o ~/Projects/dotfiles/.claude/skills/vermenschlichen/SKILL.md \
  https://raw.githubusercontent.com/LOGIN-TB/claude-skills/main/skills/vermenschlichen/SKILL.md
```

Für englische Texte gilt nichts davon, da greift der `humanizer`-Skill direkt.

## Reihenfolge

Faktenbasis zuerst, Stil danach. Auf einem faktengeprüften Text treten Bedeutungsaufblähung, Werbesprache und vage Zuschreibungen praktisch nicht auf, weil sie dort wachsen, wo ein Modell eine Wissenslücke mit plausibel klingender Fülle schließt. Umgekehrt poliert eine Stilprüfung erfundene Sätze und lässt sie besser klingen.

Übrig bleiben dann fast nur die Rhetorikmuster weiter unten. Das sind die Stellen, an denen vorhandener Inhalt zu wirkungsvoll verpackt wurde.

## Nominalstil

Im Basis-Skill nicht vorhanden und vermutlich das stärkste deutsche KI-Signal überhaupt. Ein Vorgang wird in ein Substantiv verpackt, das Verb verschwindet in „erfolgen", „durchführen", „vornehmen", „zum Einsatz kommen".

- „Die Durchführung der Messung erfolgte" → „ich habe gemessen"
- „Die Anpassung der Konfiguration wurde vorgenommen" → „ich habe die Konfiguration angepasst"

Das ist nicht dasselbe wie Passiv und muss getrennt geprüft werden.

## Schwellen

- **Passiv.** Deutsch benutzt das Passiv legitimer als Englisch, besonders in Fachtexten. Nur anstreichen, wo der Handelnde wirklich fehlt und der Satz aktiv klarer wäre.
- **Staccato.** Deutsche Sätze sind im Schnitt länger, eine Folge kurzer Sätze fällt deshalb stärker auf als im Englischen. Schwelle entsprechend niedriger ansetzen.

## Rhetorikmuster, die der Basis-Skill nicht hat

Sprachunabhängig, greifen auf Deutsch genauso:

- **Gebaute Pointen.** Jeder Absatz endet auf einem Satz, der zitierfähig klingen will. Ein einzelner kurzer Satz zur Betonung ist in Ordnung, eine Reihe davon wirkt konstruiert.
- **Aphorismus-Formeln.** „X ist das Y von Z", „X wird zur Falle", „die Sprache der …", „die Architektur des …". Die Formel durch die konkrete Aussage ersetzen, auf die sie zeigt.
- **Fragmentierte Überschriften.** Überschrift, dann ein Einzeiler, der die Überschrift bloß wiederholt, dann erst der Inhalt. Der Einzeiler kann weg.
- **Rhetorische Gesprächseinstiege.** „Ehrlich?", „Mal ehrlich", „Die Sache ist die", als vorgetäuschte Pause vor einer gewöhnlichen Aussage.
- **Diff-Erzählung.** Text, der eine Änderung erzählt, statt die Sache zu beschreiben („Diese Funktion ersetzt den früheren Ansatz …"). Gilt nicht für Changelogs, Release Notes und Migrationsnotizen, die sind von Natur aus versionsbezogen.

## Jans Kalibrierung

- **Gedankenstriche.** Der Basis-Skill rät nur zur Sparsamkeit und will bei Spannen sogar den Bis-Strich. Für Jans eigene Texte gilt stattdessen `german-text.md`: `–` und `—` kommen nicht vor, auch nicht zwischen Jahreszahlen. In 2300 Wörtern eigener Prosa null Treffer, von ihm bestätigt. Bei fremden deutschen Texten erst kalibrieren, dort ist der Gedankenstrich reguläre Duden-Typografie und kein Indiz.
- **„nicht X, sondern Y".** Kein Verbot, die Konstruktion ist gutes Deutsch. Auffällig ist die Häufung. Bei Blogartikeln nicht schätzen, sondern das Messskript aus `blog-artikel` (Stufe 5) benutzen, das ist an Jans Korpus geeicht.
- **Angekündigte Merksätze.** „Entscheidend ist …", „Genau das ist …", „Unterm Strich", „lässt sich in einen Satz fassen". Sie kündigen eine Erkenntnis an, statt sie zu erzählen. Steckt im selben Messskript.

## Was unangetastet bleibt

- Wörtliche Zitate, auch wenn sie voller Muster stecken.
- Zahlen, Messwerte, Modellnamen, Dateipfade, Codeblöcke.
- Unebener Rhythmus, Abschweifungen, ein einzelner kurzer Satz. Das sind Belege für einen Menschen, keine Fehler.
