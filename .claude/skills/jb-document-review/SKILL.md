---
name: document-review
description: "Lässt ein Dokument von einem Leser ohne den Kontext des Autors lesen und meldet zurück, was er verstanden hat und was nicht: unklare Stellen, vorausgesetztes Wissen, Widersprüche, Irrelevantes für seine Rolle. Verwenden, bevor ein Draft Final wird, und wenn gefragt wird, ob ein Text für jemand anderen verständlich ist: 'ist das verständlich', 'lies das mal als mein Chef', 'versteht das jemand ohne Kontext', 'Dokument reviewen', '/jb-document-review <Pfad>'."
argument-hint: "<Pfad zu Dokument oder Ordner> [Rolle]"
---

# Dokument-Review durch einen Leser

Der Autor schreibt Dokumente mit KI-Hilfe und reviewt sie selbst, bevor sie von Draft auf Final gehen. Dabei sieht er Lücken nicht, weil sein Kopf sie aus dem eigenen Kontext füllt. Dieser Skill gibt das Dokument einem Leser, der diesen Kontext nicht hat, und holt sich dessen Rückmeldung.

Der Skill prüft nur, ob das Dokument für den gewählten Leser verständlich und passend ist. Von den vier Checks in `document-status.md` deckt er Relevanz und Umfang ab; Quelle und Verifiziert bleiben beim Autor. Er prüft keine Fakten, keine Rechtschreibung und keinen Stil, und er schreibt nichts um. Final setzt weiterhin nur der Autor.

Der Leser hat nur das Dokument. Was der Autor den echten Lesern mündlich dazu erklärt hat, zählt hier nicht, denn in sechs Monaten ist davon nichts mehr da. Ein "Nein" des Lesers ist deshalb ein Urteil über das Dokument, nicht über die Übergabe. Wird ein Dokument nur einmal gelesen, mit dem Autor daneben, lohnt der Skill nicht. Er ist für Dokumente, die allein stehen müssen.

## 1. Leser klären

Frag Rolle, Zweck und Fundort mit einer `AskUserQuestion` ab, das Vorwissen danach im Chat. Was der Autor schon genannt hat, fragst du nicht noch einmal.

**Wer liest?**
- **Kritischer Vorgesetzter**: erfahren, wenig Zeit, will Ergebnis und Risiko, nicht den Weg. Misstraut Ausschweifungen.
- **Kollege auf gleichem Stand**: kennt die Technik, aber nicht dieses Projekt und nicht die Vorarbeit des Autors.
- **Fachfremder Kollege**: versteht Abkürzungen, Tool-Namen und Architekturbegriffe nicht ohne Erklärung.
- **Der Autor in sechs Monaten**: kennt die Technik, hat aber vergessen, warum etwas so entschieden wurde.

Vorgesetzter und Kollege arbeiten im selben Unternehmen wie der Autor. Sie kennen Teams, interne Abkürzungen und Ticket-Präfixe und bemängeln sie nicht. Ist der Leser von außen, sagt der Autor das dazu.

**Was soll der Leser danach können?** Drei Optionen: **entscheiden**, **umsetzen**, **informiert sein**. Forme daraus mit dem Thema des Dokuments einen Infinitiv, der in "weil du danach ... willst" passt, etwa "entscheiden, ob das Team den Dienst allein betreiben kann" oder "den Tableau-Upgrade selbst durchführen". Dieser Satz ist `{Zweck}` im Briefing.

**Wo findet der Leser das Dokument?** Zwei Optionen: **am echten Ort**, dann reicht der Pfad; oder **eine Kopie**, dann nennt der Autor den echten Ort über "Other". Der Fundort macht Dinge klar, die im Text nicht stehen müssen: ein `docs/beyond-the-code.md` im Repository des Dienstes braucht den Dienst nicht zu benennen. Eine Kopie in `~/Downloads` lässt den Leser Lücken bemängeln, die es am echten Ort nicht gibt.

**Was weiß der Leser schon, und wovon hat er keine Ahnung?** Freitext im Chat, zwei bis drei Sätze. Die Rolle ist grob, diese Antwort macht sie scharf: welche Systeme, Teams und Begriffe der Leser kennt und der Text voraussetzen darf, und was er nie angefasst hat und der Text deshalb erklären muss. Beispiel: "kennt Cockpit, GitLab und Nexus und das Team, hat den Dienst selbst aber nie bedient."

Fehlt der Pfad, frag danach. Der Pfad kann eine Datei oder ein Ordner sein. Ein Ordner gilt als ein Dokumentpaket, etwa eine Übergabedokumentation aus mehreren Seiten, und wird als Ganzes gelesen.

## 2. Den Leser starten

Der Review läuft in einem Subagenten mit frischem Kontext. In dieser Session liegt oft der ganze Hintergrund des Dokuments schon vor, und damit würde Claude die Lücken genauso unbewusst füllen wie der Autor. Starte `Agent` mit `subagent_type: "general-purpose"`, gib ihm nur Pfad, Fundort, Rolle, Zweck, Vorwissen und das Briefing. Keine Zusammenfassung des Dokuments, keine Hinweise, worauf er achten soll: er soll sich sein eigenes Bild machen.

Das Leseverbot im Briefing ist nur eine Anweisung, der Subagent hat alle Werkzeuge. Deshalb nennt er am Ende, was er gelesen hat, und du prüfst das in Schritt 3.

### Briefing für den Leser

> Du bist {Rolle, mit der Beschreibung aus Schritt 1}. Du liest das Dokument unter `{Pfad}`, weil du danach {Zweck} willst. Du hast es in {Fundort} gefunden. Was dieser Ort offensichtlich macht, etwa den Namen des Projekts, weißt du und bemängelst es nicht. Dein Vorwissen: {Antwort des Autors zum Vorwissen, wörtlich}. Was dort als bekannt steht, setzt du voraus. Was dort als unbekannt steht, muss der Text dir erklären. Darüber hinaus weißt du über den Autor und sein Umfeld nichts außer dem, was im Dokument steht.
>
> Lies ausschließlich diese Datei, bei einem Ordner ausschließlich die Dateien darin, beginnend mit `index.md` oder `README.md`, falls vorhanden. Öffne nichts außerhalb, durchsuche kein Repository, benutze keine Websuche und schlage nichts nach. Wenn dir etwas fehlt, ist genau das die Rückmeldung, die gebraucht wird. Wer nachschlägt, findet die Lücke nicht mehr. Einen Status-Header am Anfang ("Status: Draft", "Open: ...") ignorierst du, der ist für den Autor, nicht für dich.
>
> Du korrigierst nichts und formulierst nichts um. Du prüfst keine Fakten, du kannst sie nicht prüfen und sagst das, wo es dir auffällt. Du gibst nur zurück, wie das Dokument bei dir angekommen ist, in dieser Reihenfolge:
>
> **Das habe ich verstanden.** Der Inhalt des Dokuments in deinen eigenen Worten, fünf bis zehn Sätze. Nur das, was wirklich im Text steht. Was du dir dazudenken musstest, gehört in den nächsten Abschnitt.
>
> **Das habe ich nicht verstanden.** Offene Fragen, die dir beim Lesen gekommen sind und die der Text nicht beantwortet.
>
> **Hier war ich verwirrt.** Stellen, die konfus, widersprüchlich oder doppelt sind. Jede Stelle mit wörtlichem Zitat und einem Satz, warum sie dich aufgehalten hat.
>
> **Das setzt der Text voraus.** Begriffe, Abkürzungen, Namen und Zusammenhänge, die der Text nicht erklärt, und ob du sie in deiner Rolle kennst. Nenne sie auch dann, wenn du sie kennst, aber nur knapp.
>
> **Das brauche ich in meiner Rolle nicht.** Abschnitte, die dich von dem abhalten, was du mit dem Dokument vorhast.
>
> **Könnte ich jetzt {Zweck}?** Ja, nein, oder was dafür noch fehlt. Ein bis zwei Sätze.
>
> **Gelesen habe ich:** die Liste der Dateien, die du geöffnet hast, und sonst nichts.
>
> Antworte in der Sprache des Dokuments. Zitiere wörtlich, nicht paraphrasiert. Sei direkt. Höflichkeit, die eine Unklarheit abmildert, nimmt dem Autor genau die Information, für die er dich fragt.

## 3. Ergebnis zurückgeben

Prüfe zuerst die Liste "Gelesen habe ich". Steht dort mehr als das Dokument, ist die Rückmeldung wertlos, weil der Leser die Lücken aus anderen Quellen gefüllt hat. Sag das dem Autor und starte einen neuen Leser.

Gib die Rückmeldung des Lesers unverändert an den Autor weiter. Kürze nichts, ergänze keine eigene Einschätzung und erkläre dem Leser nichts nach ("das steht aber im Projekt-README"). Der Autor entscheidet, was er daraus macht.

Der erste Abschnitt ist der wichtigste: Weicht die Zusammenfassung des Lesers von dem ab, was der Autor sagen wollte, hat das Dokument ein Problem, auch wenn der Leser es nicht als solches benennt. Weise den Autor auf diesen Abgleich hin, in einem Satz.

Ändere das Dokument nicht. Wenn der Autor es überarbeitet hat, läuft der Skill noch einmal, mit einem neuen Subagenten: der alte hat die erste Fassung gelesen und ist kein unbelasteter Leser mehr. Für eine zweite Zielgruppe ruft der Autor den Skill ein zweites Mal auf.
