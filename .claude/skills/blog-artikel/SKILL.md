---
name: blog-artikel
description: "Wenn Jan einen Blogartikel für seine Homepage schreiben will oder Dinge sagt wie 'schreib einen Blogartikel', 'Artikel über X', 'Blogpost', 'das wäre ein Blogthema', 'darüber will ich mal was schreiben'. Führt den Artikel in sechs verbindlichen Stufen von Interview über Faktenbasis und Entwurf bis zur Freigabe. Unbedingt verwenden, sobald Text für den Blog entsteht — auch wenn Jan nur sagt 'mach mal einen Rohentwurf'. Auch für die Überarbeitung eines bestehenden Artikels verwenden."
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
[ANNAHME] Er richtet ein neues IoT-Gerät ein paar Mal im Jahr ein
```

Alles mit `[ANNAHME]` wird Jan vorgelegt, bevor geschrieben wird. Er bestätigt, korrigiert oder streicht. Was ungeklärt bleibt, kommt entweder nicht in den Text oder wird in Stufe 3 sichtbar markiert.

### Stufe 3 — Entwurf

Erst jetzt entsteht Prosa.

- Kein `[ANNAHME]` darf als glatter Satz im Text landen. Entweder belegt, gestrichen, oder sichtbar markiert:
  `> **[?]** Wie oft richtest du ein neues Gerät ein?`
- **Nie erfinden:** Häufigkeiten, Dauern, Mengen, Zeiträume, Gefühle („der Teil, auf den ich am meisten stolz bin“), berufliche Zuschreibungen, Ursachen für Entscheidungen.
- Wenn beim Schreiben eine Lücke auffällt, die in Stufe 1 durchgerutscht ist: markieren und weiterschreiben, am Ende gesammelt nachfragen.

### Stufe 4 — Faktencheck

Jan liest **das Markdown**, nicht die gerenderte Seite. Ihn ausdrücklich darauf hinweisen. Der Artikel bleibt bis dahin `draft: true`.

Offene `[?]`-Marker blockieren diese Stufe. Sie werden abgearbeitet, nicht stillschweigend entfernt.

### Stufe 5 — Stilprüfung

Gemessen gegen Jans eigene Artikel unter `~/Documents/Notes/Blog/`, nicht gegen ein abstraktes Ideal.

Vorweg eine Warnung vor den Zahlen, weil Zählwerte mehr Autorität ausstrahlen, als sie hier verdienen: Die meisten trennen Jans Prosa **nicht** von generierter. `2026-03-28-myhomepage-redesign.md`, von Jan selbst, hat 13,7 Fettungen pro 1000 Wörter — der generierte Ansible-Entwurf nur 3,6. Gedankenstriche verhalten sich genauso wenig eindeutig. Wer auf diese Werte hin optimiert, poliert am falschen Ende und hält den Text danach für geprüft.

Zwei Muster halten der Gegenprobe stand, beide null mal in Jans eigenen Artikeln und mehrfach in den generierten:

- **„nicht X, sondern Y“** — sechsmal im Homelab-Artikel, zweimal im Ansible-Entwurf. Die Konstruktion ist korrektes Deutsch; das Problem ist die Frequenz. Ein Modell greift zu ihr als rhetorischem Reflex, Jan tut das nie.
- **Angekündigte Merksätze** — „Entscheidend ist …“, „Genau das ist …“, „lässt sich in einen Satz fassen“, „Unterm Strich“. Sie kündigen eine Erkenntnis an, statt sie zu erzählen.

```sh
draft=~/Documents/Notes/Blog/<entwurf>.md
ref=~/Documents/Notes/Blog/2026-03-28-myhomepage-redesign.md
for f in "$draft" "$ref"; do
  w=$(wc -w < "$f")
  s=$(grep -o 'sondern' "$f" | wc -l)
  b=$(grep -o '\*\*' "$f" | wc -l)
  a=$(grep -oE 'Entscheidend (ist|war)|Genau das|Unterm Strich|Was bleibt|lässt sich in einen Satz' "$f" | wc -l)
  awk -v f="$(basename "$f")" -v w=$w -v s=$s -v b=$b -v a=$a \
    'BEGIN{printf "%-40s %5d Wörter  sondern=%-3d Merksätze=%-3d Fettungen/1k=%.1f\n", f, w, s, a, b/2*1000/w}'
done
```

Die Zählung ist ein Rauchmelder, kein Prüfsiegel. Sie findet zwei Muster; die übrigen KI-Fingerabdrücke findet nur das Lesen (siehe `~/Projects/dotfiles/.claude/rules/no-ai-tells.md`):

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
