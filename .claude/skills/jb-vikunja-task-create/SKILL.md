---
name: vikunja-task-create
model: haiku
description: "Legt einen neuen Task in Vikunja an. Trigger: 'neuer Task', 'merk vor', 'leg einen Task an', 'erinnere mich daran', 'schreib das auf meine Liste'. Titel und Projekt sind Pflicht (Standard: Inbox), Fälligkeit wird aus natürlicher Sprache geparst und das passende Projekt aus dem Titel erraten. Auch verwenden, wenn Jan das Wort 'Vikunja' nicht nennt."
---

# Vikunja-Task anlegen

Delegiere das Anlegen an den `vikunja-agent` (Haiku). Der Agent macht Projekt-Inferenz, Datums-Parsing, Wiederholungs-Mapping und legt den Task an. Diese Skill ist absichtlich dünn, damit das Domänen-Wissen zentral bleibt.

## Vorgehen

Rufe per `Agent` tool den Subagent `vikunja-agent` auf:

- `subagent_type`: `vikunja-agent`
- `description`: kurz, z. B. „Vikunja-Task anlegen"
- `prompt`: `Operation: create.` gefolgt von Jans Anweisung **wörtlich** (oder so wörtlich wie möglich).

Der Agent extrahiert Titel, Projekt, Fälligkeit und Wiederholung selbst — du brauchst nichts vorzukauen. Übergib lieber zu viel Kontext als zu wenig (z. B. wenn Jan nebenbei „bei Gelegenheit" oder „am Wochenende" erwähnt — das gehört zur Fälligkeit).

**Beispiel-Aufruf:**

```
Operation: create.
Jans Eingabe: „neuer Task: Zertifikat Insign auf PROD austauschen, fällig 15.07.2026, alle 3 Monate"
```

Die Bestätigung des Agents 1:1 an Jan zurückgeben (`✅ Task „..." angelegt in *...*`).

**Fehlerfall:** Wenn der Agent eine `⚠️ Vikunja-Server nicht erreichbar`-Meldung zurückgibt, leite sie weiter. Der Titel steht in der Meldung, damit Jan beim Retry nicht neu tippen muss.
