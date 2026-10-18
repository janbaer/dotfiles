---
name: forgejo-project-interview
model: opus
description: Interview Jan about a project and record the result in docs/requirements.md (requirements with stable IDs R1, R2, ...) and docs/design.md (project-wide design decisions that point back to the requirements they satisfy), plus one document per service or role under docs/services/ and docs/roles/ for decisions that concern only that one. Two modes - init for a new project, update for later changes. Use this skill when starting a project and Jan wants to define what it must do, when a Forgejo issue adds, changes or drops a requirement or a design decision, or when Jan says "project interview", "requirements", "design decision", "what should this project do", or "record this decision".
---

# Forgejo Project Interview

Keeps a few small documents per project in step with the issues that change it. Issues say what to do now. These documents say what the project must do and why it is built that way, and they outlive the issues.

| Document | Holds | Written by |
|---|---|---|
| `docs/requirements.md` | What the project must do as a whole. One testable sentence per ID. | Jan decides, Claude drafts |
| `docs/design.md` | Project-wide decisions that are not obvious from the code, with the reason. | Claude drafts, Jan confirms |
| `docs/services/<name>.md`, `docs/roles/<name>.md` | Decisions that concern only that service or role. | Claude drafts, Jan confirms |

The link runs one way. A design entry names the requirements it satisfies. A requirement never lists designs: a second direction doubles the upkeep. To see how R3 is built, `grep -r R3 docs/`.

## Scope

`requirements.md` and `design.md` are loaded at every PR review, so they stay short.

- A requirement is something the project must do as a whole: about 10 to 15 of them, rarely more. Statements about a single service, host, port, tag, limit, file mode or variable name are not requirements. If a statement holds only for one role or service, it is not one. Test: would a reviewer need it for any PR?
- `design.md` holds about 5 to 10 decisions that apply across the project. Test: would the decision matter in a PR about a completely different service? If not, it goes into the document of that service or role, even when that document gets a single entry. `design.md` lists those documents by path, so the reviewer knows when to read them.
- A README next to a service or role is an operating guide: setup, configuration, troubleshooting. A reason in it whose loss could break a PR (why something is built this way, what it protects) belongs in the document under `docs/`, and the README points to it. Operating instructions and reasons never appear in both places.

## Formats

`docs/requirements.md`:

```markdown
# Requirements

This document lists what the project must do, one requirement per line with a stable ID (R1, R2, ...) that `docs/design.md` refers to.

- **R1** The system SHALL do X. *Check:* `command or observable result` (optional)
- **R2** ...
```

- One sentence, one fact, testable. Split a requirement that contains "and".
- IDs are never reused or renumbered. A dropped requirement stays in the list as `- ~~**R4**~~ Dropped in #N: <reason>`.

`docs/design.md`:

```markdown
## <Decision in a few words>

<What was decided and why. The trade-off and the escape hatch. 2-5 sentences.>

Satisfies: R1, R3 · Origin: #N · Date: YYYY-MM-DD
```

- Write only what the code does not show: a constraint that surprises, a rejected alternative that someone will propose again, a value that must move together with another.
- A replaced decision stays. Add `Superseded by: <title> (#N)` to the old entry and write the new one.
- Take the date from `date`, never from memory.
- `Origin` is the issue number. Without a Forgejo issue, write `Origin: initial`.
- The documents under `docs/services/` and `docs/roles/` use the same entry format. An entry without a matching requirement leaves out `Satisfies`.

On creation, `design.md` and every document under `docs/services/` and `docs/roles/` get the Draft header from `document-status.md`. Final is Jan's call.

## Mode: init

Use when the project has no `docs/requirements.md`, or it holds no requirements yet. Interview with the `grill-me` skill, in this order, so that each round rests on settled answers:

1. **Purpose.** What is the project for, who uses it, what does success look like, what is explicitly out of scope.
2. **Requirements.** Draft R-IDs from the answers, at project level (see Scope). Ask Jan which are real requirements and which are wishes. Make each one testable, split compound ones. Move a statement about one service or role out of the list: it is a decision, not a requirement.
3. **Foundational design.** For each requirement that forces a choice (stack, storage, architecture, hosting, security model), ask for the decision and the reason. Record it with `Satisfies:` in `design.md`. A decision that concerns only one service or role goes into its document under `docs/services/` or `docs/roles/`.
4. **Gaps.** A requirement without a decision may be fine (nothing to decide yet). A project-wide decision without a requirement is a smell: ask which requirement it serves, or whether a requirement is missing.

Tell grill-me not to offer creating a Forgejo issue at the end. Then write all files, show them to Jan, and wait for approval before writing to disk.

Afterwards:
- Add a pointer to `requirements.md` and `design.md` in `CLAUDE.md` (and in `docs/project.md` if it exists), so later sessions and the PR reviewer find them. Say that service and role decisions live under `docs/services/` and `docs/roles/`.
- Offer one line for `.code-review.md`: a PR that adds, changes or drops a requirement or a decision updates the matching document in the same PR (`requirements.md`, `design.md`, or the document of the service or role).

## Mode: update

Use when an issue or a conversation touches a requirement or a decision. Input: an issue number, or free text.

1. Read `requirements.md` and `design.md`, the document of the affected service or role if there is one, and for an issue its `## Requirement` section.
2. Classify the change against the existing IDs: new requirement, changed wording, dropped, or none. "None" is a valid and common answer: stop and say so. A statement that holds only for one service or role is no new requirement.
3. Check the design entries that name the affected IDs. Do they still hold? Propose a new, amended or superseding entry only where a real decision was made or reversed. Choose the target by the Scope test: `design.md` for project-wide decisions, otherwise the document of the service or role (create it with the Draft header and add it to the list in `design.md`).
4. Show the proposed diff for every file involved, including the new entry in the list in `design.md`.

Who confirms what:
- **A new requirement the issue states in its own words:** take it over, no question.
- **Changing or dropping an existing requirement:** always ask. Requirements are Jan's, and a silent rewording hides a scope change.
- **A design entry:** draft it from what the implementation actually did. When called from `forgejo-issue-implement` under `Auto-implement`, write it without asking and name it in the final notification, so Jan reviews it in the PR.

Commit the document changes with the code of the issue, in the same PR.

## Rules

- Do not invent requirements. A requirement comes from something Jan said or wrote. Mark an inference as a question, not as a requirement.
- Do not copy issue text into `requirements.md`. The issue holds the delta, the repo holds the state. If they disagree later, the repo wins.
- Keep `requirements.md` and `design.md` short. Past about 15 requirements or 10 decisions, move service- or role-specific items out or merge related ones, instead of letting the list grow.
- Do not ask questions the code or the existing documents already answer. Read first.
