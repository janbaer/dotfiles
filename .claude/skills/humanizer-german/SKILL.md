---
name: humanizer-german
description: "Deutsche Ergänzung zum humanizer-Skill. Verwenden, sobald ein deutscher Text auf KI-Spuren geprüft oder entschärft werden soll: 'humanizer auf Deutsch', 'klingt das nach KI', 'lies den Text gegen', 'entschärfe die KI-Spuren', oder wenn Jan den humanizer auf einen deutschen Blogartikel, eine Notiz oder ein Dokument anwenden will. Ersetzt bei deutschen Texten den direkten Aufruf des humanizer-Skills."
---

# humanizer auf deutschen Texten

Der `humanizer`-Skill ist auf englische KI-Muster geeicht. Auf Deutsch ist ein Teil seiner Regeln unverändert brauchbar, ein Teil läuft leer, und vier Regeln beschädigen den Text. Dieser Skill legt die deutsche Schicht darüber.

## Zuerst den Basis-Skill lesen

```
~/.claude/skills/humanizer/SKILL.md
```

Dort stehen die 33 Muster mit Beispielen. Sie werden hier **nicht wiederholt**, nur korrigiert und ergänzt. Die Nummern unten beziehen sich auf die Abschnitte dieser Datei.

**Benötigt wird genau dieser Skill: https://github.com/blader/humanizer**

Er ist nicht von Jan, sondern ein Klon dieses Repos, und steht deshalb in der `.gitignore`. Dort **nichts ändern**, Änderungen sind beim nächsten Neuinstallieren weg. Genau dafür gibt es diese Datei hier.

Fehlt er auf dieser Maschine, sag das und arbeite nicht ersatzweise nur mit dieser Datei. Der deutsche Aufsatz ohne die 33 Basismuster ist keine Prüfung, sondern eine halbe. Nachinstallieren:

```bash
git clone https://github.com/blader/humanizer.git ~/Projects/dotfiles/.claude/skills/humanizer
```

## Regeln, die auf Deutsch nicht gelten

Diese vier stammen aus der englischen Orthografie. Sie werden **übersprungen**, nicht abgeschwächt.

- **§19 Anführungszeichen.** Der Basis-Skill will gerade Anführungszeichen. Im Deutschen sind `„…“` die korrekte Typografie und kein KI-Indiz. Umgekehrt gilt: Ein gerades `"` als Schlusszeichen ist hier der Fehler.
- **§17 Title Case.** Deutsch kennt kein Title Case, Substantive werden grammatisch großgeschrieben. Die Regel würde Substantive kleinschreiben und einen Grammatikfehler erzeugen.
- **§26 Bindestrich-Paare.** Die Unterscheidung zwischen attributiver und prädikativer Stellung gibt es im Deutschen nicht. Komposita werden zusammengeschrieben oder nach Regel gekoppelt.
- **§14 Gedankenstriche.** Im Englischen ein überstrapaziertes, aber legitimes Mittel. Im Deutschen reguläre Duden-Typografie. Für **Jans** Texte bleibt das Verbot trotzdem hart, das kommt aber aus seinem Korpus und aus `german-text.md`, nicht aus der Sprache. Bei fremden deutschen Texten erst kalibrieren.

## Regeln, die eine deutsche Wortliste brauchen

Diese laufen sonst leer und melden nichts, was fälschlich wie Entwarnung aussieht.

**§7 KI-Vokabular.** Verdächtig bei Häufung, nicht einzeln: zudem, darüber hinaus, maßgeblich, essenziell, wegweisend, vielfältig, nachhaltig (figurativ), im Wandel, Landschaft (abstrakt), Meilenstein, prägend, facettenreich, Zusammenspiel, eindrucksvoll, hervorheben, unterstreichen, verdeutlichen.

**§8 Copula-Vermeidung.** Sehr starkes deutsches Signal: stellt … dar, fungiert als, bildet den Kern, gilt als, zeichnet sich aus durch, verfügt über, weist … auf. Ersatz ist fast immer ein schlichtes „ist“ oder „hat“.

**§23 Füllfloskeln.** im Rahmen von, in Bezug auf, vor dem Hintergrund, es gilt zu beachten, an dieser Stelle sei erwähnt, im Zuge dessen.

**§3 Partizipialanhängsel.** Das englische „-ing“-Muster entspricht der nachgeklebten Konstruktion: „…, was die Bedeutung unterstreicht“, „…, wodurch sich zeigt“, „…, was den Fortschritt verdeutlicht“. Der Satz endet, bevor die Wertung kommt.

## Fehlende Kategorie: Nominalstil

Im Basis-Skill nicht vorhanden und vermutlich das stärkste deutsche KI-Signal überhaupt. Ein Vorgang wird in ein Substantiv verpackt, das Verb verschwindet in „erfolgen“, „durchführen“, „vornehmen“, „zum Einsatz kommen“.

- „Die Durchführung der Messung erfolgte“ → „ich habe gemessen“
- „Die Anpassung der Konfiguration wurde vorgenommen“ → „ich habe die Konfiguration angepasst“

Das ist nicht dasselbe wie §13 (Passiv) und muss getrennt geprüft werden.

## Schwellen anders einstellen

- **§13 Passiv.** Deutsch benutzt das Passiv legitimer als Englisch, besonders in Fachtexten. Englische Jagdintensität überkorrigiert. Nur anstreichen, wo der Handelnde wirklich fehlt und der Satz aktiv klarer wäre.
- **§31 Staccato.** Deutsche Sätze sind im Schnitt länger, eine Folge kurzer Sätze fällt stärker auf. Schwelle niedriger als im Original.
- **§9 Negative Parallelkonstruktionen.** Trifft als „nicht nur …, sondern auch“ und „nicht X, sondern Y“. Der `sondern`-Zähler im `blog-artikel`-Skill misst genau das und ist an Jans Korpus geeicht. Bei Blogartikeln dessen Messskript benutzen statt selbst zu schätzen.

## Reihenfolge

Faktenbasis zuerst, humanizer danach. Auf einem faktengeprüften Text treten die Muster §1 bis §6 (Bedeutungsaufblähung, Werbesprache, vage Zuschreibungen, „Herausforderungen und Ausblick“) praktisch nicht auf, weil sie dort wachsen, wo ein Modell eine Wissenslücke mit plausibel klingender Fülle schließt. Umgekehrt poliert der humanizer erfundene Sätze und lässt sie besser klingen.

Übrig bleiben dann fast nur Rhetorikmuster: gebaute Pointen (§31), Aphorismus-Formeln (§32), fragmentierte Überschriften (§29). Das sind die Stellen, an denen vorhandener Inhalt zu wirkungsvoll verpackt wurde.

## Was unangetastet bleibt

- Wörtliche Zitate, auch wenn sie voller Muster stecken.
- Zahlen, Messwerte, Modellnamen, Dateipfade, Codeblöcke.
- Alles, was der Basis-Skill unter „Signs of human writing“ auflistet. Unebener Rhythmus, Abschweifungen und ein einzelner kurzer Satz sind Belege für einen Menschen, keine Fehler.
