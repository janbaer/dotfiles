---
name: mailbox-assistent
description: >-
  E-Mail-Entwürfe schreiben, Termine abfragen und anlegen, Kontaktdaten
  nachschlagen, Posteingang zusammenfassen. Alles über Jans Konto bei
  mailbox.org. Verwenden, sobald Jan eine Mail an jemanden schreiben will
  ("schreib eine Mail an Edith", "Entwurf an meine Frau", "antworte auf die
  Mail von..."), nach Terminen fragt ("hab ich morgen was", "trag einen Termin
  ein", "wann ist der Arzttermin"), eine Telefonnummer, Adresse oder
  Mailadresse von jemandem braucht, oder wissen will, was im Posteingang
  liegt. Auch dann verwenden, wenn Jan die Wörter mailbox.org, IMAP, CalDAV
  oder Kalender gar nicht nennt.
---

# Mailbox-Assistent

Drei Backends für ein Konto bei mailbox.org: IMAP für Mail, CalDAV für Termine,
CardDAV für Kontakte. Jedes hat eine Eigenheit, die unten steht. Wer sie
ignoriert, bekommt leere Ergebnisse oder Fehler ohne Meldung.

## Grundregeln

**Es wird nie eine Mail verschickt.** Der IMAP-Server ist bewusst so
konfiguriert, dass die Sendewerkzeuge gar nicht existieren. Es gibt nur
Entwürfe. Wenn Jan "schick eine Mail" sagt, meint er trotzdem einen Entwurf.
Sag ihm am Ende, dass der Entwurf im Ordner Drafts liegt und er ihn selbst
abschickt.

**Entwürfe ohne Rückfrage, Termine mit Rückfrage.** Einen Entwurf liest Jan im
Mailprogramm ohnehin noch einmal, bevor er ihn abschickt. Also direkt
schreiben. Ein falscher Kalendereintrag dagegen fällt später auf und muss
gesucht werden. Also vorher zeigen: Titel, Datum, Uhrzeit, Dauer, Ort. Erst
nach Jans OK anlegen.

**Aufgaben gehören nicht hierher.** Für Todos gibt es Vikunja
(`vikunja-task-create`, `vikunja-task-query`). Die vier CalDAV-Kalender
`Aufgaben`, `Computer`, `Erledigt` und `Soon` enthalten nur VTODO und werden
von diesem Skill nicht angefasst.

## Bevor du anfängst: Server prüfen

Die drei MCP-Server hängen an einem Passwort aus der Umgebung. Fehlt es beim
Start der Session, verbindet sich der Server nicht, und jeder Aufruf schlägt
fehl. Das passiert regelmäßig genug, um es vorher zu prüfen.

Prüfe nur den Server, den du für die aktuelle Aufgabe brauchst, nicht alle
drei. Ein billiger Leseaufruf genügt: `mcp__caldav-mcp__list-calendars` für
Termine, `mcp__carddav-mcp__list-address-books` für Kontakte,
`mcp__imap-mcp__imap_list_folders` für Mail.

Kommt ein Verbindungsfehler, sag Jan:

> Der Server `<name>` ist nicht verbunden. Führ bitte `/mcp` aus und verbinde
> ihn neu, dann mache ich weiter.

Rate nicht herum und bau keinen Umweg. Ohne Server keine Daten.

## Kontakte

Werkzeuge: `mcp__carddav-mcp__list-contacts` und `get-contact`.

Adressbücher, in dieser Reihenfolge suchen. Die URLs sind absolut, anders als
beim Kalender:

| Adressbuch | URL |
| --- | --- |
| Kontakte | `https://dav.mailbox.org/carddav/32/` |
| Private Adressen | `https://dav.mailbox.org/carddav/43/` |

`list-contacts` liefert Name, UID, Mailadressen und Telefonnummern von rund 25
Karten, das ist billig genug für eine Suche nach Namen. Für Adresse,
Geburtstag oder Beziehungen danach `get-contact` mit der UID. Eingebettete
Fotos sind in der zurückgegebenen vCard durch einen Größenhinweis ersetzt,
der Aufruf ist also auch bei Karten mit Portrait unbedenklich.

### "Meine Frau", "meine Mutter", "mein Bruder"

Diese Auflösung läuft immer über **Jans eigene Karte**, UID
`af2d3f63-a277-4d62-97e8-4f34fead255d` im Adressbuch `Kontakte`. Ein
`get-contact` darauf liefert das Feld `relations`:

```json
{"Spouse": "Susann Baer", "Mother": "Edith Baer", "Brother": "Randolf Baer"}
```

Nimm den Namen zur passenden Rolle und such dann diese Person. Die Karten der
anderen Personen taugen dafür nicht: auf Ediths Karte steht als verwandter
Name nur die Rolle ("Mutter"), nicht Jans Name.

**Anrede.** `du` bei Mutter, Bruder und Ehefrau, also bei den drei Personen,
die über die Rollen `Mother`, `Brother` und `Spouse` erreichbar sind. `Sie` bei
allen anderen, auch bei Freunden und Kollegen. Nicht aus dem Tonfall der
Anfrage ableiten.

Findest du niemanden, frag Jan nach der Adresse. Erfinde keine.

## E-Mail-Entwürfe

Werkzeug: `mcp__imap-mcp__imap_save_draft`.

Der Entwurfsordner wird automatisch gefunden, der Ordner `Drafts` trägt das
Kennzeichen `\Drafts`. Kommt trotzdem ein Fehler ohne Meldung zurück, gib
`folder: "Drafts"` mit, dann läuft es.

Ablauf:

1. Empfänger über die Kontakte auflösen, wenn Jan einen Namen statt einer
   Adresse nennt.
2. Text schreiben. Sprache wie die Anfrage, im Zweifel Deutsch. Anrede aus dem
   Skript übernehmen.
3. `imap_save_draft` mit `to`, `subject`, `text`, `folder: "Drafts"`.
4. Jan kurz sagen, was im Entwurf steht und wo er liegt.

Bei einer Antwort auf eine vorhandene Mail: erst
`mcp__imap-mcp__imap_search_emails` oder `imap_get_latest_emails`, um die
Nachricht zu finden, dann `imap_get_email` für den Volltext, dann
`imap_save_draft` mit `inReplyTo` (die `messageId` der Originalmail) und
`references`. Betreff mit `Re: ` davor. So bleibt der Thread zusammen.

Für den Ton gilt `no-ai-tells`: Jans eigene Sprache, knapp, keine
Aufzählungszeichen in Fließtext, keine Floskeln wie "ich hoffe, es geht dir
gut". Bei deutschen Texten gelten zusätzlich die Regeln aus `german-text`,
also echte Umlaute und keine Gedankenstriche.

## Termine

Werkzeuge: `mcp__caldav-mcp__list-events`, `create-event`, `update-event`,
`delete-event`.

Kalender-URLs (relativ, nicht absolut, anders als bei CardDAV):

| Kalender | URL | Nutzung |
| --- | --- | --- |
| Kalender | `/caldav/Y2FsOi8vMC8zMQ/` | Standard, hier alles anlegen |
| Geburtstage | `/caldav/Y2FsOi8vMS8w/` | nur lesen, wird aus den Kontakten erzeugt |

Die vier Kalender `Aufgaben`, `Computer`, `Erledigt` und `Soon` enthalten nur
VTODO und bleiben außen vor. Stimmt eine URL nicht mehr, hol sie über
`list-calendars` neu.

**Zeiten kommen und gehen in UTC.** `list-events` liefert `...Z`, Jan lebt in
Europe/Berlin. Rechne vor der Ausgabe um: im Sommer plus zwei Stunden, im
Winter plus eine. Ein Termin auf `12:30:00.000Z` ist im August 14:30 Uhr.
Beim Anlegen umgekehrt den Offset explizit hinschreiben,
`2026-08-20T14:00:00+02:00` statt `...Z`, sonst landet der Termin zwei Stunden
daneben.

Serientermine sind aufgelöst: eine Serie liefert einen Eintrag je Termin im
Zeitraum, mehrere Einträge teilen sich also dieselbe `uid`. Das Feld
`recurring` sagt, ob der Termin aus einer Wiederholung stammt. Ganztägige
Termine, etwa Geburtstage, stehen auf der lokalen Mitternacht ihres Tages, ein
Geburtstag am 5. Juli kommt also als `2026-07-04T22:00:00.000Z`. Das ist
richtig, nicht um einen Tag verschoben.

Ganztägige Termine bekommen beim Anlegen `wholeDay: true`, Start und Ende am
selben Tag. Zum Ändern oder Löschen brauchst du die `uid`. Zeig Jan vorher,
welchen Termin du meinst, besonders wenn mehrere ähnlich heißen.

## Posteingang

Werkzeuge: `imap_get_latest_emails`, `imap_search_emails`, `imap_get_email`,
`imap_get_unread_count`, `imap_list_folders`, `imap_find_thread_messages`.

Bei "was ist neu" nimm `imap_get_latest_emails` mit `folder: "INBOX"` und einer
kleinen Anzahl, etwa 10 bis 15. Fass zusammen, statt Betreffzeilen
abzuschreiben: wer schreibt, worum geht es, ist etwas zu tun. Volltext nur über
`imap_get_email` nachladen, wenn die Zusammenfassung ohne ihn nicht trägt, denn
ganze Mails sind lang.

Markieren, Verschieben und Löschen ist nicht möglich, diese Werkzeuge sind
abgeschaltet.

## Wenn etwas nicht geht

| Symptom | Ursache | Lösung |
| --- | --- | --- |
| Kontaktliste leer | Fork nicht gebaut, `npm run build` fehlt | siehe Konfiguration |
| Termine mit Datum aus 2024 | dito, Serienauflösung fehlt | siehe Konfiguration |
| Entwurf schlägt fehl, keine Meldung | Ordnererkennung hakt | `folder: "Drafts"` mitgeben |
| Termin zwei Stunden verschoben | Zeit als UTC geschrieben | Offset `+02:00` benutzen |
| Verbindungsfehler | Passwort fehlte beim Sessionstart | Jan bitten, `/mcp` auszuführen |
| Sendewerkzeug fehlt | Absicht, nicht Fehler | Entwurf anlegen, Jan schickt selbst |

## Konfiguration

Die Server stehen in `/home/jan/Projects/.mcp.json`.

**IMAP** ist `imap-mcp-server` von npm. Das Konto liegt in
`~/.imap-mcp/accounts.json` mit leerem Passwortfeld, das Passwort kommt aus
`MAILBOX_ORG_IMAP_PASSWORD`. Die Liste der erlaubten Werkzeuge steht in
`IMAP_MCP_ENABLED_TOOLS`; alles, was senden oder löschen kann, fehlt dort
absichtlich.

**CalDAV und CardDAV** laufen aus gepatchten Forks in `~/Projects/caldav-mcp`
und `~/Projects/carddav-mcp`, nicht aus npm. Beide Originale scheitern an
Open-Xchange: `list-contacts` liefert eine leere Liste, weil die Bibliothek
`tsdav` bei der Suche nach den Karten-URLs einen `prop-filter` ohne Bedingung
schickt, den mailbox.org mit null Treffern beantwortet, und `list-events` gibt
bei Serienterminen das Startdatum der Serie zurück statt der Termine im
abgefragten Zeitraum. Die Forks beheben beides.

Nach einem `git pull` in einem der beiden Verzeichnisse muss `npm run build`
laufen, sonst zeigt `.mcp.json` auf einen veralteten `dist`-Ordner.
