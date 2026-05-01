---
name: vikunja-task-query
description: "Beantwortet Fragen wie 'Was ist der nächste Task, den ich erledigen muss?', 'Was steht heute an?', 'Welche Vikunja-Tasks habe ich offen?', 'Was muss ich noch erledigen?', 'Hab ich noch was offen?', 'Was kommt als nächstes?', 'Liste meine Todos'. Holt alle offenen Tasks aus Vikunja, sortiert nach Dringlichkeit (überfällig → heute → bald → später → ohne Datum) und gibt eine priorisierte Liste mit dem dringendsten Task hervorgehoben zurück. Unbedingt verwenden, sobald Jan nach offenen Aufgaben, Tasks, Todos oder seiner To-do-Liste fragt — auch wenn er das Wort 'Vikunja' nicht explizit nennt."
---

# Vikunja-Tasks abfragen

Delegiere die Arbeit an den `vikunja-agent` (Haiku) und gib dessen Ausgabe 1:1 an Jan zurück. Der Agent kennt Jans Projekte, sortiert in Tiers und formatiert die Liste — diese Skill ist absichtlich dünn, damit das Domänen-Wissen zentral bleibt.

## Vorgehen

Rufe per `Agent` tool den Subagent `vikunja-agent` auf:

- `subagent_type`: `vikunja-agent`
- `description`: kurz, z. B. „Liste offener Vikunja-Tasks"
- `prompt`: `Operation: list-prioritized. Bitte alle offenen Tasks priorisiert ausgeben.`

Der Agent retourniert fertiges Markdown (Top-Task hervorgehoben, Tier-Sektionen). Übergib das ohne weitere Bearbeitung an Jan.

**Fehlerfall:** Wenn der Agent eine `⚠️ Vikunja-Server nicht erreichbar`-Meldung zurückgibt, leite die einfach weiter — kein Workaround, kein Raten.
