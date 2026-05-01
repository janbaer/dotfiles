# File location rules

Skills, commands, agents, and rules belong under `~/Projects/dotfiles/.claude/` — never directly under `~/.claude/`.

## Why

`~/Projects/dotfiles` is a git-versioned repo synced across all of Jan's machines. Files written directly into `~/.claude/` exist only on the current host and are lost on other machines.

## How to apply

When creating or editing one of these file types, always use the dotfiles path:

| Type     | Correct path                                     |
| -------- | ------------------------------------------------ |
| Command  | `~/Projects/dotfiles/.claude/commands/<name>.md` |
| Skill    | `~/Projects/dotfiles/.claude/skills/<name>/`     |
| Agent    | `~/Projects/dotfiles/.claude/agents/<name>.md`   |
| Rule     | `~/Projects/dotfiles/.claude/rules/<name>.md`    |

`~/.claude/commands/`, `~/.claude/skills/`, `~/.claude/rules/` are home-manager symlinks back to the dotfiles directories — anything written to dotfiles is live in `~/.claude/` immediately.

`~/.claude/agents/` is currently a real directory, **not** a symlink. After creating a new agent in dotfiles, also create a symlink so Claude Code picks it up:

```bash
ln -s ~/Projects/dotfiles/.claude/agents/<name>.md ~/.claude/agents/<name>.md
```

If a file unexpectedly does not appear under `~/.claude/<subdir>/<name>` after editing it in dotfiles, the same fix applies: symlink it manually.

## Exception: machine-local files

Settings that are intentionally per-machine — e.g. `~/.claude/settings.local.json`, OAuth tokens, MCP credentials, history, telemetry — stay in `~/.claude/`. This rule only applies to reusable artefacts (commands, skills, agents, rules).
