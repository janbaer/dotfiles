# Skill / command / agent language

When authoring or editing a skill, slash command, or subagent definition, pick the language deliberately:

- **Git / code tooling and generic developer workflows** → **English**.
  Examples: `review-diff`, `review-staged`, `review-diff-executor`, commit/PR/CI helpers, refactor planners, anything that runs over diffs, lint output, or repo state.

- **Personal workflows that produce German output** → **German**.
  Examples: Vikunja task skills, Obsidian diary skills, anything where Jan expects the conversation and final output to be in German.

## Why

Code tooling lives in an English domain — commit messages, diffs, lint output, error messages are all English. Writing the surrounding skill in English keeps a single language per file and matches the domain. Personal skills produce German artefacts (diary entries, task lists); writing them in German keeps the subagent in the right voice and avoids it drifting into English mid-task.

## How to apply

- Stay consistent within a single file. Don't mix half German, half English.
- If you're unsure which bucket a new skill falls into, ask Jan before drafting.
- This applies to the SKILL.md / command.md / agent.md prose, frontmatter description, and any inline examples. Code blocks and shell commands stay literal regardless.
