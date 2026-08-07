---
name: vikunja-task-query
model: haiku
description: "Beantwortet Fragen nach offenen Aufgaben: 'Was steht heute an?', 'Was muss ich noch erledigen?', 'Was kommt als nächstes?', 'Liste meine Todos'. Holt die offenen Vikunja-Tasks und gibt sie nach Dringlichkeit sortiert zurück, der dringendste hervorgehoben. Auch verwenden, wenn Jan das Wort 'Vikunja' nicht nennt."
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
