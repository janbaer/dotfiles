---
name: skill-audit
description: Audits Jan's own skills, agents and commands against the current Anthropic authoring guidance, grouped by target model (Haiku, Sonnet, Opus), and first checks whether newer model guides exist than the checklist was verified against. Read-only, reports findings and changes nothing. Use when Jan says "skill audit", "Skills prüfen", "sind meine Skills noch aktuell", after a new model release, or before reworking skills.
argument-hint: "[name fragment ...]"
disable-model-invocation: true
---

# Skill audit

Checks `jb-*` skills, agents and commands against `references/checklist.md`, per target model. Reports only. Edits happen afterwards, per skill, after Jan approves.

## Procedure

1. **Check for newer guides.** Fetch the entry point listed in the checklist under "Verified against" and read its "Model-specific guidance" section. Each guide link carries family and version in its URL (`prompting-claude-opus-5-5`). Ignore Fable and Mythos. Compare the newest version per family (opus, sonnet, haiku) with the checklist table.
   - Same or older: continue.
   - Newer: fetch that guide, take only statements about prompts, skills, instructions, effort and scope, and show Jan the proposed rule changes with the quote and URL for each. Update the checklist, its table and the verified date (`date +%F`) only after Jan approves. Claims without an official source go under "Unverified".
   - Section missing or unparseable: say so, search for the guides instead, and continue with the old checklist marked as possibly stale.
2. **Run the script.** Names narrow the run to matching skills:
   ```
   python3 ~/Projects/dotfiles/.claude/skills/jb-skill-audit/scripts/audit.py [name ...]
   ```
   A `model:` value that is neither an alias nor a full model ID is reported by G1. A pinned full ID does not follow new versions: mention it in the report.
3. **Triage.** The script finds candidates for G2, G6, G7, G8, G12, G13, D1, O1, F1. Open each flagged file and decide: real finding or false positive.
4. **Manual rules** (G9 to G11, O2 to O4, S2 to S4, H1): only for skills Jan names or uses daily. Do not read every skill for them.
5. **Report** one table per model: skill, finding ID, one-line fix, open points as questions. Do not edit anything.
