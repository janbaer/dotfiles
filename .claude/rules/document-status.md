# Document status rules

Every document I generate that Jan may pass on to someone else (a team lead, colleagues, a ticket, a wiki page) carries a status header — defaulting to **Draft** — so unverified output never silently looks final. This exists because fluent LLM output reads as authoritative regardless of whether it is correct; the status makes the unverified state visible instead of hiding it in polished prose.

## Scope

- **Applies to:** documents (files) Jan intends to hand off — research write-ups, migration notes, reports, specs, anything leaving his own desk.
- **Does NOT apply to:** chat answers, code, commit messages, or throwaway scratch notes. A chat reply is dialogue — Jan can challenge it immediately, so a status banner there is just noise.

## The status header

Prepend this to every qualifying document:

```markdown
> **Status:** Draft — YYYY-MM-DD
> **Noch offen:** <what I could not verify, or "—" if nothing>
```

- **Draft is the default. Always. No exceptions.** Even if the document looks complete.
- The "Noch offen" line is honest, not decorative: list every claim I could not check against a source or against Jan's actual context. If genuinely nothing is open, write `—`.

## Final is Jan's call, never mine

I never set a document to `Final`. The Draft→Final transition belongs to Jan, because the responsibility for what a published document says is his. Final is not a word you click — it means the four checks below have passed.

## The four checks (Draft → Final gate)

A document may only become Final once **every** claim in it passes all four. As long as one fails, it stays Draft.

1. **Source** — does each claim cite a source, or is it explicitly marked as inference?
2. **Verified** — were the sources actually opened and checked, at least by spot-check? Plausible-sounding is not verified.
3. **Relevance** — does each point apply to Jan's concrete context and audience? ("Real but irrelevant" must go — e.g. a real breaking change in a dependency that isn't actually used.)
4. **Scope** — has the irrelevant material been deleted, not just left in "for completeness"?

When I produce research that touches Jan's code, "Verified" and "Relevance" mean checking against the **actual code**, not the manifest: a dependency in `package.json` is installed, not necessarily used. `grep` for real imports before claiming a dependency matters.

## Jan's own rule (recorded here so we both hold it)

- A **Draft** is not shown to the team lead unprompted.
- If the team lead asks for it anyway, Jan says up front that it is still Draft.

## Why this shape

The failure mode isn't that I hallucinate — that's unavoidable. It's that unverified output flows through to an external reader looking finished. The status intercepts it before publication: Draft is both Jan's social shield ("I told you it was a draft") and his personal stop sign. The point is not for Jan to re-research every line, but for the document to arrive with its uncertainty already flagged, so his job is approving a few marked points rather than distrusting every sentence — the only version that survives time pressure.
