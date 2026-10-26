---
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: reference
tags: [homelab, docker, security]
status: draft
---

# Homelab: Technologie-Stack je Dienst

Welche Laufzeit steckt hinter welchem Dienst, und in welcher Version? Gedacht für die Frage: "Betrifft mich die neue Sicherheitslücke in Node.js, Python, Go, PHP oder Bun?"

Die Tabellen werden aus `homelab-techstack.json` gerendert (Dataview, JavaScript-Abfragen müssen aktiv sein). Die Datei schreibt der Skill `homelab-inventory`, die Version steht in der Zeile "Gemessen". Go- und Rust-Versionen sind die Compiler-Version des Binaries, keine Laufzeit im Container. Zeilen mit "Stand" stammen aus `data/manual.json` des Skills und sind nicht gemessen.

```dataviewjs
const d = JSON.parse(await dv.io.load("DevOPs/Docker/homelab-techstack.json"));
const sections = [
  ["node", "Node.js"], ["bun", "Bun (eigene Software)"], ["python", "Python"],
  ["go", "Go"], ["rust", "Rust"], ["php", "PHP"], ["other", "C, C++ und Sonstiges"],
];
const num = v => /^\d/.test(v) ? v.split(/[.\-]/).map(n => parseInt(n, 10) || 0) : null;
const cmp = (a, b) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0, y = b[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
};
const cell = e => e.source === "manual" && e.version !== "offen" ? `${e.version} (Stand ${e.as_of})` : e.version;

dv.paragraph(`Gemessen: ${d.measured}`);

for (const [key, title] of sections) {
  const rows = d.entries.filter(e => e.runtime === key);
  if (key === "php" && rows.length === 0) {
    dv.header(2, "PHP");
    dv.paragraph(`Kein PHP im Homelab (alle Hosts und Container geprüft am ${d.measured}).`);
    continue;
  }
  if (rows.length === 0) continue;
  dv.header(2, title);
  dv.table(["Dienst", "Version", "Host"], rows.map(e => [e.service, cell(e), e.host]));
}

dv.header(2, "Auffälligkeiten");
const notes = [];
for (const [key, title] of sections.filter(s => s[0] !== "other")) {
  const rows = d.entries.filter(e => e.runtime === key && num(e.version));
  if (rows.length < 2) continue;
  rows.sort((a, b) => cmp(num(a.version), num(b.version)));
  const lo = rows[0], hi = rows[rows.length - 1];
  if (lo.version !== hi.version) notes.push(`${title}: älteste Version ${lo.version} (${lo.service}), neueste ${hi.version} (${hi.service}).`);
}
const latest = [...new Set(d.entries.filter(e => e.image && /:latest$|^[^:]+$/.test(e.image)).map(e => e.service))];
if (latest.length) notes.push(`Dienste mit \`latest\`-Tag, deren Laufzeit sich mit jedem Pull ändert: ${latest.join(", ")}.`);
const stale = d.entries.filter(e => e.source === "manual" && e.version === "offen").map(e => e.service);
if (stale.length) notes.push(`Version offen (nicht messbar): ${stale.join(", ")}.`);
dv.list(notes);
```

## References

- [[My Current Techstack]] — Liste aller Dienste ohne Versionen
- [[Docker]] — Container-Laufzeit auf allen Hosts
- [[Bun]] — Laufzeit für howcani und worktime-logger
