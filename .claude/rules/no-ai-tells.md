# No AI tells

Anything I produce that Jan hands off — code, commit messages, Jira tickets, PR descriptions, review replies — must read as if Jan wrote it himself. It must not carry the fingerprints of AI-generated output.

## Why

Jan's teamlead treats visibly AI-generated work as "slop" and blames Jan personally when he spots it — it has already happened with commit messages, Jira tickets, and code. The reputational cost lands on Jan, not on me. This rule is not about output quality in the abstract; it is about not exposing Jan.

## Scope

Applies to everything that leaves Jan's own desk: source code, comments, commit messages, ticket text, PR/MR descriptions, code-review responses. Does not apply to throwaway chat replies to Jan himself.

## The tells to avoid

- **Explanatory comments.** The single biggest tell. No comment blocks that restate what the code does or narrate the reasoning. Match the surrounding file — most code here has no comments at all. If a comment only exists to explain the change to a reader, cut it. (Reinforces the global "avoid unnecessary comments" rule.)
- **Vestigial scaffolding.** No leftover stubs — unused/underscore-prefixed params, dead branches, "for future use" hooks. Finish the change cleanly; delete what the change orphaned.
- **Over-engineering.** No speculative abstractions, no defensive guards for impossible cases, no configurability that wasn't asked for. Minimal diffs that trace directly to the request read as human.
- **AI-flavored prose.** No emojis in prose, no "Here's what I did", no bullet-point summaries baked into commit bodies, no formulaic hedging. Keep commit and ticket text in Jan's own terse voice per the commit conventions. The commit-type emoji from `commits.md` is Jan's own convention, not a tell — it stays.
- **Uniform over-consistency.** Real code is slightly uneven. Don't rename everything to a perfect scheme or reflow untouched lines just to be tidy.

## How to apply

- Read the surrounding code first and mirror its density, naming, and comment level.
- Default to removing rather than adding. When unsure whether a comment or abstraction belongs, it doesn't.
- Before finishing, reread the diff and ask: "would a reviewer looking to catch AI spot anything here?" If yes, strip it.
