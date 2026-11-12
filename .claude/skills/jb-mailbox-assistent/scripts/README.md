# Konfiguration der MCP-Server

Die Serverliste liegt in `~/Projects/nixos-config/modules/home/dev/files/claude/projects.mcp.json`
und wird von home-manager nach `~/Projects/.mcp.json` verlinkt. Benutzername
und Passwörter stehen dort nur als Platzhalter, die Werte legt der Wrapper
`claudeRun` aus `gopass` in die Umgebung.

Alle drei Server laufen aus lokalen Klonen unter `~/Projects`, keiner aus npm:

| Server | Verzeichnis | Grund |
| --- | --- | --- |
| `imap-mini-mcp` | `~/Projects/imap-mini-mcp`, Branch `main` des Originals (`florianbuetow`) | einziger IMAP-Server, der Entwürfe kann und nicht senden kann |
| `caldav-mcp` | `~/Projects/caldav-mcp`, Branch `mailbox` | Original löst Serientermine nicht auf |
| `carddav-mcp` | `~/Projects/carddav-mcp`, Branch `mailbox` | Original liefert bei Open-Xchange eine leere Kontaktliste |

Der Branch `mailbox` ist in den beiden Forks ein reiner Integrationszweig.
`imap-mini-mcp` braucht keinen mehr, der HTML-Rückfall (PR #6) ist upstream
gemergt. Der Branch enthält:

| Fork | Inhalt von `mailbox` |
| --- | --- |
| `caldav-mcp` | Upstream `main`, die Serienauflösung (PR #94) und der Ganztags-Fix des Maintainers (dessen PR #91, dort noch offen) |
| `carddav-mcp` | Upstream-Standardbranch plus PR #3 und #4 |

Der Branch ist wegwerfbar: nichts hängt an seiner Historie, nur am gebauten
Ergebnis. Wenn upstream etwas davon annimmt, wird er neu aus dem aktuellen
Stand plus den noch offenen Teilen aufgebaut, statt ihn fortzuschreiben.

Zum Einrichten oder Aktualisieren gibt es `scripts/setup-mcp-servers.sh`
neben dieser Datei. Es holt alle drei Repositories, stellt sie auf den
richtigen Branch und baut sie. Jan ruft es selbst auf, einmal pro Rechner,
du brauchst es im Gespräch nicht.

Das Skript ist Übergangswerk. Sobald die Pull Requests bei `dominik1001`
angenommen sind und `imap-mini-mcp` auf npm liegt (bisher nicht veröffentlicht), laufen alle drei wieder
per `npx`, und dann können das Skript und dieser Abschnitt weg.
