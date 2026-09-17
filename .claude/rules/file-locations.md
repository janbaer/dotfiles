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
| Hook script  | `~/Projects/dotfiles/.claude/hooks/<name>.sh`         |
| User settings| `~/Projects/dotfiles/.claude/user-settings.json`      |

`~/.claude/commands/`, `~/.claude/skills/`, `~/.claude/rules/`, `~/.claude/agents/`, `~/.claude/output-styles/` are home-manager symlinks back to the dotfiles directories — anything written to dotfiles is live in `~/.claude/` immediately.

`~/.claude/settings.json` belongs there too, but under the name `user-settings.json`. A `home.activation` step in `nixos-config` links it directly to the dotfiles file, so `/config` and Claude Code itself keep writing to it and every change lands as a diff instead of drifting on one machine. It must not go through `home.file` with `mkOutOfStoreSymlink`: that link chain runs through the read-only Nix store, and Claude Code's atomic write fails there with `EROFS`. The name matters: a file called `settings.json` inside `dotfiles/.claude/` would ALSO be read as project settings whenever Claude Code runs in the dotfiles repo, and the same file would be loaded twice under two scopes — array keys such as `hooks` merge, so every hook would fire twice there.

A hook script only runs when it is registered under an event in that file; putting the script in `hooks/` does nothing on its own.

## Exception: machine-local files

Values that must differ per machine go to `~/.claude/settings.local.json`, which stays out of git and overrides the shared file. Same for OAuth tokens, MCP credentials, history and telemetry — those stay in `~/.claude/`.
