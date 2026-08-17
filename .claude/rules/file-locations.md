# File location rules

Skills, commands, agents, rules, and output styles belong under `~/Projects/dotfiles/.claude/` — never directly under `~/.claude/`.

## How to apply

When creating or editing one of these file types, always use the dotfiles path:

| Type         | Correct path                                          |
| ------------ | ----------------------------------------------------- |
| Command      | `~/Projects/dotfiles/.claude/commands/<name>.md`      |
| Skill        | `~/Projects/dotfiles/.claude/skills/<name>/`          |
| Agent        | `~/Projects/dotfiles/.claude/agents/<name>.md`        |
| Rule         | `~/Projects/dotfiles/.claude/rules/<name>.md`         |
| Output style | `~/Projects/dotfiles/.claude/output-styles/<name>.md` |

`~/.claude/commands/`, `~/.claude/skills/`, `~/.claude/rules/`, `~/.claude/agents/`, `~/.claude/output-styles/` are home-manager symlinks back to the dotfiles directories — anything written to dotfiles is live in `~/.claude/` immediately.

## Exception: machine-local files

Settings that are intentionally per-machine — e.g. `~/.claude/settings.json`, `~/.claude/settings.local.json`, OAuth tokens, MCP credentials, history, telemetry — stay in `~/.claude/`. This rule only applies to reusable artefacts (commands, skills, agents, rules, output styles).
