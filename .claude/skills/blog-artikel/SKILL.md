---
name: blog-artikel
description: "Wenn Jan einen Blogartikel für seine Homepage schreiben will oder Dinge sagt wie 'schreib einen Blogartikel', 'Artikel über X', 'Blogpost', 'das wäre ein Blogthema', 'darüber will ich mal was schreiben'. Führt den Artikel in sechs verbindlichen Stufen von Interview über Faktenbasis und Entwurf bis zur Freigabe. Unbedingt verwenden, sobald Text für den Blog entsteht — auch wenn Jan nur sagt 'mach mal einen Rohentwurf'. Auch für die Überarbeitung eines bestehenden Artikels verwenden."
disable-model-invocation: true
---

# Blogartikel schreiben

Dieser Skill existiert wegen eines konkreten Fehlschlags: Ein Artikel wurde aus reinem Repo-Wissen heraus geschrieben. Das Repo zeigt, *was* gebaut wurde, nie *warum*. Die fehlenden Begründungen wurden mit plausibel klingenden Sätzen gefüllt, und weil die genauso flüssig lasen wie der Rest, musste Jan den Text hinterher Satz für Satz auf Wahrheit prüfen. Erfunden waren unter anderem eine Cluster-Begründung, die nie seine war, eine Häufigkeitsangabe („zweimal im Jahr dreißig Sekunden“) und eine berufliche Zuschreibung, die das Gegenteil der Wahrheit war.

Die Stufen unten verhindern genau das. Sie sind verbindlich und werden **nicht** übersprungen, auch nicht auf Zuruf („mach einfach mal schnell einen Entwurf“). Wenn Jan zur Eile drängt, ist die richtige Antwort, Stufe 1 zu verkürzen, nicht sie wegzulassen.

## Ablauf

### Stufe 1 — Interview

Zuerst Kontext sammeln (Repo, vorhandene Notizen, frühere Artikel), aber **daraus keine Motive ableiten**. Das Interview klärt, was im Code nicht steht.

Harte Regeln für diese Stufe:

- **Fragen werden einzeln gestellt, nummeriert und als Frage erkennbar.** Niemals eine Frage in einen Fließtextabsatz einbetten — Jan überliest das nachweislich. Das ist ein Fehler im Format, kein Vorwurf an ihn.
- Wo es sinnvolle Antwortoptionen gibt, `AskUserQuestion` benutzen. Das erzwingt eine Antwort statt sie zu erhoffen.
- Höchstens fünf Fragen pro Runde. Lieber mehrere Runden.
- Gefragt wird nach dem **Warum**, nicht nach dem Was: Warum diese Hardware, warum diese Entscheidung verworfen, was ging schief, was hat gedauert, was hast du dabei gelernt.
- Explizit nach Zahlen fragen, wenn welche in den Text sollen: Häufigkeiten, Dauern, Mengen, Zeiträume. Diese Angaben **nie** schätzen.
- Explizit fragen, was aus Sicherheitsgründen nicht in den Text darf.

Am Ende der Stufe: kurze Zusammenfassung des Verstandenen, Bestätigung abwarten.

### Stufe 2 — Faktenbasis

Vor dem ersten Prosasatz eine Faktenliste anlegen, im Scratchpad-Verzeichnis der Session als `fakten-<slug>.md`, nicht im Artikel. Eine Datei statt einer Liste im Chatverlauf, damit sie eine Kompaktierung übersteht und Jan jederzeit reinschauen kann. Jede Angabe bekommt eine Herkunft:

```
[JAN]     Über 20 IoT-Geräte, gewachsen seit dem Umzug
[REPO]    services/hermes-agent/defaults.yml: OpenAI-kompatibles Gateway
[MESSUNG] sox verwirft beim Abbruch den unvollständigen Block   (nicht Jans Wissen)
[ANNAHME] Er richtet ein neues IoT-Gerät ein paar Mal im Jahr ein
```

Alles mit `[ANNAHME]` wird Jan vorgelegt, bevor geschrieben wird. Er bestätigt, korrigiert oder streicht. Was ungeklärt bleibt, kommt entweder nicht in den Text oder wird in Stufe 3 sichtbar markiert.

Der Zusatz **`(nicht Jans Wissen)`** ist die zweite Achse und wird oft vergessen: Die Herkunftsmarker sagen, ob eine Angabe belegt ist, nicht, ob Jan sie kennt. Ein Befund, den ich selbst gemessen oder aus dem Code gelesen habe, ist wahr und trotzdem nicht seiner. Solche Zeilen kriegen den Zusatz, damit Stufe 3 sie erkennt.

### Stufe 3 — Entwurf

Erst jetzt entsteht Prosa.

- Kein `[ANNAHME]` darf als glatter Satz im Text landen. Entweder belegt, gestrichen, oder sichtbar markiert:
  `> **[?]** Wie oft richtest du ein neues Gerät ein?`
- **Nie erfinden:** Häufigkeiten, Dauern, Mengen, Zeiträume, Gefühle („der Teil, auf den ich am meisten stolz bin“), berufliche Zuschreibungen, Ursachen für Entscheidungen.
- Wenn beim Schreiben eine Lücke auffällt, die in Stufe 1 durchgerutscht ist: markieren und weiterschreiben, am Ende gesammelt nachfragen.

#### Der Erklärtest

Der Artikel steht in Jans Stimme. Ein Satz kann vollständig belegt sein und trotzdem nicht in den Text gehören, weil er aus meinem Kopf stammt und nicht aus seinem. Der Test dafür lautet:

> Könnte Jan diesen Satz jemandem im Gespräch erklären, ohne nachzuschlagen?

Beispiel aus dem Spracherkennungs-Artikel, beide Sätze waren belegt:

- „Das Aufnahmeprogramm nimmt in feste Blöcke von 32.768 Byte auf.“ Nein. Das hat er nie gewusst und würde es nie so erzählen.
- „Eine Umgebungsvariable erreicht den von Hyprland gestarteten Keybind nicht.“ Ja, ohne zu zögern. Das ist sein Fachgebiet.

Die Grenze verläuft entlang seiner Expertise, nicht quer durch den ganzen Artikel. Linux, NixOS, Container, APIs, Infrastruktur: da schreibt er selbst so. Was das Thema des Artikels neu einführt, meistens nicht.

Fällt ein Satz durch, gibt es drei Auswege, in dieser Reihenfolge:

1. **Zuschreiben.** „Claude hat zwei Ursachen gefunden“ statt einer Erklärung aus dem Nichts. Das ist zugleich der ehrliche Weg, die Arbeitsteilung sichtbar zu machen.
2. **Auf das Ergebnis eindampfen.** Symptom und Wirkung bleiben, der Mechanismus fällt weg.
3. **Streichen.**

Der Test läuft nebenbei gegen die Länge: Ein Artikel, der zu lang wird, ist oft einer, in dem ich meine Befunde ausgebreitet habe statt Jans Erfahrung.

### Stufe 4 — Faktencheck

Jan liest **das Markdown**, nicht die gerenderte Seite. Ihn ausdrücklich darauf hinweisen. Der Artikel bleibt bis dahin `draft: true`.

Offene `[?]`-Marker blockieren diese Stufe. Sie werden abgearbeitet, nicht stillschweigend entfernt.

### Stufe 5 — Stilprüfung

Hier ist zuerst zu klären, wogegen überhaupt gemessen wird, weil die naheliegende Antwort falsch ist.

Ein Korpus eigener Texte gibt es kaum: Alles ab 2026 ist KI-geschrieben, übrig bleiben rund 2300 Wörter Deutsch von 2013 bis 2020, davon die Hälfte Reiseberichte. Und selbst diese Texte sind **kein Stilziel**. Jan schreibt heute anders als 2013, er hat dazugelernt, und die Arbeit mit KI hat seine eigene Schreibweise mitverändert. Ein Entwurf, der auf den Korpus hin optimiert wird, trifft einen Jan, den es nicht mehr gibt.

Der Korpus beantwortet deshalb nur eine schmale Frage: Welche Gewohnheiten sind über dreizehn Jahre stabil geblieben? Alles andere, also Länge, Gliederung, Dichte, Tonfall, entscheidet Jan am Entwurf. Bei Stilfragen ist er die Instanz, nicht die Datei von 2013.

Stabil und von Jan selbst bestätigt ist genau eine Sache:

- **Typografische Gedankenstriche.** Er hat sie nie benutzt. In 2300 Wörtern eigener deutscher Prosa kommen `–` und `—` null mal vor, im Redesign-Artikel 14 mal, im Homelab-Artikel 4 mal. Das ist keine Statistik, aus der sich eine Regel ableiten lässt, sondern eine Gewohnheit, die Jan bestätigt hat. Deshalb gilt sie hart.

Zwei weitere Muster sind verdächtig, aber aus eigener Logik heraus, nicht wegen des Korpus. Beide sind rhetorische Reflexe von Sprachmodellen und stehen dort, wo ein einfacher Aussagesatz gereicht hätte:

- **„nicht X, sondern Y“** — im Homelab-Artikel 2,2 mal pro 1000 Wörter. Kein Verbot, die Konstruktion ist gutes Deutsch. Auffällig ist die Häufung.
- **Angekündigte Merksätze** — „Entscheidend ist …“, „Genau das ist …“, „lässt sich in einen Satz fassen“, „Unterm Strich“. Sie kündigen eine Erkenntnis an, statt sie zu erzählen.

Was **nicht** funktioniert, obwohl es sich nach Messung anfühlt: Fettungen zählen. Jans Git-Hooks-Artikel liegt bei 30,9 pro 1000 Wörter und damit über jedem KI-Text.

```sh
f=~/Documents/Notes/Blog/<entwurf>.md
w=$(wc -w < "$f")
awk -v w=$w \
  -v d="$(grep -o '[–—]' "$f" | wc -l)" \
  -v s="$(grep -o 'sondern' "$f" | wc -l)" \
  -v a="$(grep -oE 'Entscheidend (ist|war)|Genau das|Unterm Strich|Was bleibt|lässt sich in einen Satz' "$f" | wc -l)" \
  'BEGIN{printf "%d Wörter  Striche=%d  sondern/1k=%.1f  Merksätze=%d\n", w, d, s*1000/w, a}'
```

Striche gehören auf 0, die beiden anderen Werte sind Rauchmelder ohne festen Grenzwert. Die Zählung ersetzt das Lesen nicht: Die übrigen KI-Fingerabdrücke findet nur der Durchgang von Hand (siehe `~/Projects/dotfiles/.claude/rules/no-ai-tells.md`):

- Dreiergruppen als Stilmittel („kein A, kein B, kein C“)
- jeder Abschnitt endet auf einer Pointe
- gleichmäßige Absatzlängen ohne Abschweifung
- ein „Was ehrlich noch fehlt“-Abschnitt, der Bescheidenheit als Geste inszeniert statt konkret zu werden
- vorgetäuschte Innerlichkeit als Übergang: „Der Teil, auf den ich am meisten stolz bin:“ stand so im Ansible-Entwurf und war nie Jans Satz

Die letzten beiden Punkte sind die teuersten, weil sie wie Persönlichkeit aussehen und deshalb beim Faktencheck durchrutschen.

### Stufe 6 — Freigabe

`draft: false` setzt **ausschließlich Jan**. Nie selbst umstellen, auch nicht auf ein beiläufiges „kann raus“ hin — dann nachfragen, ob er den Flag selbst setzt.

Vor der Freigabe prüfen:

- Gibt es zu jedem Querlink wirklich eine Datei dieses Namens? Wird ein Artikel nachträglich umbenannt, bleiben die Links in den anderen Artikeln auf dem alten Slug stehen und laufen ins Leere.
- Verweisen die Querlinks auf Artikel, die auch veröffentlicht sind? Ein Link auf einen `draft: true`-Artikel läuft ebenso ins Leere.
- Ist ein Datum in der Zukunft gesetzt? Dann synct der Artikel nicht.

## Ablage und Technik

- Artikel liegen als `YYYY-MM-DD-slug.md` direkt unter `~/Documents/Notes/Blog/`.
- Bilder kommen in einen gleichnamigen Unterordner: `~/Documents/Notes/Blog/YYYY-MM-DD-slug/`.
- `~/Projects/myhomepage/content/blog/` ist **generiert**. Dort niemals schreiben — `scripts/sync-blog.ts` zieht die Artikel aus dem Vault und überspringt dabei `draft: true` sowie Daten in der Zukunft.
- Der Slug ist der Dateiname ohne `.md`, Querlinks lauten `/blog/<dateiname-ohne-md>`.
- Das Datum im Dateinamen und `date:` im Frontmatter sind immer identisch. Ändert sich eines, wird das andere mitgezogen — und der gleichnamige Bildordner ebenfalls.

Frontmatter:

```yaml
---
title: "…"
description: …
date: YYYY-MM-DD
draft: true
categories:
  - technology        # oder development
tags:
  - …
---
```

## Was nie in einen Artikel gehört

Jans stehende Vorgabe, ohne Rückfrage anzuwenden:

- Hostnamen, interne Domainnamen, FQDNs
- öffentliche IP-Adressen, IPv6-Präfixe, Portnummern
- Zugangsdaten jeder Art, Storage-Box-Benutzer, Repo-Pfade beim Hoster
- alles, was seinen Arbeitgeber betrifft oder auf ihn schließen lässt

Im Zweifel weglassen und im Chat erwähnen, statt es in den Text zu schreiben und zu fragen.

## Sprache

Deutsch, in Jans Stimme: sachlich, erste Person, unprätentiös, gelegentlich trocken. Umlaute und `ß` korrekt setzen, auch wenn Jans Eingaben sie ASCII-ersetzen. Deutsche Anführungszeichen `„…“`, nie das gerade `"` als Schlusszeichen. Keine Emojis.

Keine typografischen Gedankenstriche. Wo einer im Entwurf steht, gehört dort ein Komma, ein Doppelpunkt, ein Punkt oder eine Klammer hin. Jan schreibt so, und ein Text voller `—` liest sich sofort nach Maschine. Der Bindestrich in zusammengesetzten Wörtern bleibt davon unberührt.
