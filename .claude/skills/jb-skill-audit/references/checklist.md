# Skill audit checklist

Verified against the official docs on 2026-10-02 (Claude Code docs and blog read via summary only, numbers not checked verbatim). Rule IDs match the output of `scripts/audit.py`.

Fable and Mythos rules are out of scope: Jan does not run skills on them. A Fable-only rule appears below only where the same statement is made for Opus or Sonnet.

## Verified against

Entry point (stable): https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices, section "Model-specific guidance". It links one guide per model.
Skills page (stable): https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
Claude Code skills reference (stable, wins over the Skills page for Claude Code limits): https://code.claude.com/docs/en/skills
Anthropic blog, 2026-06-03: https://claude.dev/blog/lessons-from-building-claude-code-how-we-use-skills (no trailing slash)

| Family | Guide the rules below were checked against | Version |
|---|---|---|
| opus | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5 (also opus-5) | 5.5 |
| sonnet | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5 | 5.5 |
| haiku | no guide exists, Skills page only | 4.5 |

Rules apply to the newest version of a family. A newer guide replaces a rule only after Jan has approved the change.

## All models

| ID | Rule | Check |
|---|---|---|
| G1 | `name` lowercase, digits, hyphens, max 64 chars, no "anthropic"/"claude"; `model` is a valid alias. Folder prefix `jb-` is intentional, never flag name vs. folder | auto |
| G2 | `description` non-empty, no `<` or `>`, says what the skill does and when to use it, in third person. Key use case first. Claude Code caps `description` + `when_to_use` together at 1,536 chars in the skill listing (the Platform pages say 1,024 for uploads, which Jan does not use) | auto + manual |
| G3 | SKILL.md body under 500 lines | auto |
| G4 | Reference files over 100 lines start with a contents list | auto |
| G5 | References sit one level deep, linked from SKILL.md, not from other references | auto |
| G6 | No time-sensitive statements in the body. Dates and model names are only acceptable as examples | auto finds, manual decides |
| G7 | Scripts: install line for every dependency next to the script, forward slashes in paths | auto finds scripts, manual |
| G8 | No instruction to write out reasoning in the reply. It can trigger a `reasoning_extraction` refusal on current models. Ask for a short explanation or a summary of actions instead | auto finds, manual decides |
| G9 | Fragile or irreversible steps (merge, delete, force push, money) use low freedom: an exact command or a script. Open steps use goals | manual (F1 lists candidates) |
| G10 | Ordered work has a checklist and a "return to step N" on failure. Order-free work has none | manual |
| G11 | Critical rules sit in the first part of SKILL.md. Skill content is not re-read on later turns, and after compaction only the first 5,000 tokens of each invoked skill are kept (25,000 shared) | manual |
| G12 | Daily skills have a Gotchas section: the failures Claude actually hit, extended each time a new one appears. The blog calls it the highest-signal content of a skill | auto (daily list in `audit.py`), manual |
| G13 | Skills only Jan invokes by hand set `disable-model-invocation: true`. That removes the description from the context and saves listing budget (about 1% of the window, least used skills lose their descriptions first) | auto lists candidates, Jan decides |
| D1 | A skill that depends on today's date or time injects it with `` !`date +%F` `` instead of telling the model to run `date`. Injection runs before the model sees the skill, so the session-start date cannot leak in. It follows the permission rules, so it may need `allowed-tools` | auto lists candidates |

## Opus (3 skills at the time of writing)

| ID | Rule | Check |
|---|---|---|
| O1 | Remove explicit verification instructions ("final verification step", "double-check", "use a subagent to verify"). Opus verifies on its own and over-verifies when told to | auto finds, manual decides |
| O2 | Give the complete task and a definition of done up front. Steps only where the order matters | manual |
| O3 | Skills that write documents state the wanted length, otherwise output runs long | manual |
| O4 | Skills that touch code or files state the scope: do what was asked, mention extras at the end | manual |

Opus 5.5 states that existing Opus 5 prompts work without changes. Do not rewrite for its own sake.

## Sonnet 5.5 (14 skills at the time of writing)

| ID | Rule | Check |
|---|---|---|
| S1 | No wording that discourages tool use ("minimize tool calls", "only when strictly necessary") | auto |
| S2 | At low and medium effort Sonnet may stop to ask before the work is done. First set `effort` in the skill frontmatter (`low`, `medium`, `high`, `xhigh`, `max`, per Claude Code docs; per-model support unverified). Only then add "keep working until everything asked is done, stop only when blocked or before a risky step" | manual, test run |
| S3 | Code-changing skills: it adds tests, docs and files unasked. If unwanted, add "don't add features, tests, files or refactors that weren't asked for; mention them at the end" | manual |
| S4 | Skills that run code state that a real check (tests, build) must run before reporting done | manual |

## Haiku (10 skills at the time of writing)

No official 5.x guide exists. Source is the Skills page: "Does the Skill provide enough guidance?"

| ID | Rule | Check |
|---|---|---|
| H1 | Keep numbered steps. A step Haiku skips becomes clearer or becomes a script | manual, test run |
| H2 | No rule from O1 to O4 or S2 to S4 applies by default. Whether `effort` is supported on Haiku is unverified | n/a |

## Unverified, report only

| ID | Rule | Why unverified |
|---|---|---|
| E1 | Many capital-letter emphasis words (MUST, NEVER, IMPORTANT) hurt newer models | Claimed in a video and in blogs, not found on the official pages |
| F1 | Lists skills with destructive commands for G9 | Heuristic only |

## Method per target model

For the most used skills: run the same task on every model the skill targets, then compare.

- Haiku misses a step: clarify the step or script it.
- Opus does worse with the skill than without: cut instructions until it does not.
- Sonnet stops early or adds extras: apply S2 or S3.
