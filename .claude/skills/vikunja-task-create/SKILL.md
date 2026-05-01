---
name: vikunja-task-create
description: "Legt einen neuen Task in Vikunja an. Trigger: 'neuer Task: ...', 'merk vor: ...', 'füg in Vikunja hinzu: ...', 'leg einen Task an für ...', 'Task erstellen: ...', 'erinnere mich daran, ...', 'noch zu tun: ...', 'schreib das auf meine Liste'. Pflichtangaben sind Titel und Projekt (Standard: Inbox). Fälligkeit ist optional und wird aus natürlicher Sprache geparst (morgen, Freitag, in 3 Tagen, am 5.5.). Erkennt aus dem Titel, in welches Projekt der Task am besten passt — z. B. Rechnungen/Verträge → Finanzen, Server/Docker/k3s/Backups → Homelab, Putzen/Garten/Reparaturen → Haushalt, Job/CVE/Code-Themen → CHECK24 - BU. Unbedingt verwenden, sobald Jan etwas in Vikunja ablegen oder sich für später vormerken will — auch wenn er das Wort 'Vikunja' nicht nennt."
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
