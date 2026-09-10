# Signal over completeness

Commit bodies, PR descriptions and CHANGELOG entries are written for someone who
will read them under time pressure, months later. Everything that does not help
that person is noise — and noise does not just waste space, it buries the two
sentences that mattered. Past a certain length people skim, then stop.

The test for every sentence: **would leaving this out change what the reader
does or understands?** If not, cut it.

## What belongs in

- What changed, and why it changed.
- What someone touching this later would otherwise get wrong: a constraint that
  surprises, a value that must move together with another, a fix that only
  covers half the cases.

## What does not

- How the answer was arrived at. Alternatives considered and rejected, values
  that were wrong in an earlier draft, what a review pass found.
- Measurements, unless a number is the reason for the decision. "30d peak
  493 MiB" earns its place next to a limit; the full table does not.
- The same fact in three places. Pick the one where it will be looked for.
- Process narration — "the review caught", "an earlier draft", "verified by".
  State the result, not the path to it.

## Per format

| | Length | Carries |
| --- | --- | --- |
| CHANGELOG entry | 2–3 sentences | What changed, why |
| Commit subject | < 72 chars | The motive, plus the object it applies to |
| Commit body | A short paragraph or two | The mechanism, the trade-off, the escape hatch |
| PR description | Summary plus how to test | What a reviewer needs to judge it |

The detail that gets cut is not lost: a commit body may carry what the CHANGELOG
should not, and the OpenSpec artifacts — where a project has them — are the right
home for reasoning, measurements and rejected alternatives.

## Why

Jan, 2026-09-10, on a CHANGELOG entry that ran eight lines: "Das sind einfach zu
viele Informationen, die niemand später liest." The failure mode is not that the
text is wrong. It is that the important part is in there somewhere, and nobody
reads far enough to find it.
