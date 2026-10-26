---
name: forgejo-issue-review
description: Use when a Forgejo issue draft or an existing issue should be reviewed for maintainability and design before anyone implements it. A reviewer on another model asks what a maintainer would complain about in the straightforward implementation. Called by jb-forgejo-issue-create, or on its own. Trigger on "review the issue", "review the ticket", "is this ticket well shaped", "issue review".
---

# Forgejo Issue Review

Reviews the *shape* of what a ticket asks for, before it is implemented. The question is not whether the ticket is clear (that is `jb-forgejo-issue-create`, field 8) but whether doing exactly what it says leaves the code in a state a maintainer would reject.

A ticket states what Jan wants, not how it is built. A reviewer that only reads the ticket validates it, and so do the author and Jan: nobody asks how else it could be done. This review exists to ask that once, with the repository open, and to hand the answer back as feedback.

## Input

An issue number (read it with `get_issue_by_index`) or the path of a draft file, plus the repository: `owner/repo` from `git remote get-url origin`, and the local path of the clone. For several drafts created together, use one reviewer.

## Run the review

1. Write the issue text to a scratchpad file when it is not one already.
2. Start one subagent on a model other than the one running this session: `Agent` with `subagent_type: "general-purpose"` and an explicit `model`, because a fresh agent inherits yours by default. The model table is in step 6 of `jb-forgejo-issue-create`; this is the only place it is kept.
3. Give it the issue file, the repository path, and the brief below. Give it the issue, not your own view of it, so it forms its own.

### Brief for the reviewer

> You review a ticket before anyone implements it. Stay read-only. Read the issue, then read the files it names and look at how this repository already solves similar things (grep for neighbours of what the ticket adds: other templates, configs, helpers, tests).
>
> Ask one question: **what would a maintainer complain about in six months in the most straightforward implementation of this ticket?** Look for:
> - Content that changes often (HTML, CSS, prompts, message texts, thresholds, lists) written as literals in source instead of living in a file or config that is edited without touching code.
> - An existing mechanism in the repository that the ticket ignores or duplicates.
> - A change that has to be made in several places together, with nothing that keeps them in step.
> - The next likely change to the result (a new colour, a new field, a new case): who makes it, and in how many files?
>
> Report at most three findings, most important first. Report fewer, or "no findings", when that is the truth; padding hides the findings that matter. For each finding give: what is wrong in the straightforward implementation, the concrete next change that would hurt (a scenario, not a principle), the evidence in the repository (file or existing pattern, or "not verified"), and one acceptance criterion that states the wanted outcome as behaviour and can be checked by a command or test, without prescribing the technique. Example: "The look of the mail changes by editing one file and no Python is touched; a test changes only that file and sees the output change."
>
> Do not comment on wording, spelling or whether the ticket is clear. Do not propose alternatives for their own sake.

## Report to Jan

Show the findings as the reviewer gave them, checked against the repository where you can, with unverified ones marked. Drop a finding only when it is plainly wrong, and say so. End with the question which criteria to take over.

The review never edits the ticket. When called from `jb-forgejo-issue-create`, the session creating the ticket writes the criteria Jan accepted into the draft before the preview. When called on its own for an existing issue, the session Jan names edits the issue after Jan says which findings count.
