# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Jan's personal dotfiles: shell, terminal, git, and Claude Code configuration for his Linux and macOS machines. The Neovim setup and the Hyprland desktop environment (waybar, kitty, rofi, swaync, wlogout) previously lived here but have been removed — Neovim now lives in a separate `neovim-config` project. Do not reintroduce references to them.

## Deployment model (important)

There is **no** `sync.sh`, install script, or build step. This repo is the source of truth; deployment happens through NixOS **home-manager**, which symlinks files from here into `$HOME` and `~/.claude/`. The home-manager configuration itself lives in a separate NixOS repo, not here.

Consequences when editing:

- Editing a file in this repo is live immediately on the current machine (it's the symlink target). No sync step to run.
- `~/.claude/commands/`, `~/.claude/skills/`, `~/.claude/rules/` are symlinks back to `.claude/` here. `~/.claude/agents/` is a real directory, so a new agent needs a manual symlink (see `.claude/rules/file-locations.md`).
- Machine-local secrets (`.claude/settings.json`, `.zshrc.local`, `.zshrc.secrets`, OAuth/MCP credentials) are git-ignored and stay out of this repo.

## Structure

- **`.claude/`** — the largest and most active part of the repo. Jan's Claude Code configuration, versioned so it syncs across machines:
  - `skills/` — task-specific skills (Forgejo/GitLab PR workflows, Vikunja tasks, Obsidian diary, fitness/security/knowledge helpers). Many skills under `~/.claude/skills/` are external and git-ignored — only Jan's own live here.
  - `commands/` — slash commands (`commit`, `review-diff`, `review-staged`, `jira-ticket`, etc.).
  - `agents/` — subagent definitions (`code-reviewer`, `review-diff-executor`, `vikunja-agent`).
  - `rules/` — behavioral rules auto-loaded into every session (see below).
  - `hooks/` — shell hooks (e.g. `work-hours-check.sh` warns when private projects are touched during work hours; `howcani-reminder.sh` nudges toward the howcani skill).
  - `knowledge-base/` — Jan's coding preferences and working agreement, read on demand.
- **`.config/`** — tool configs: `zsh/` (the actual shell config; `ZDOTDIR=$HOME/.config/zsh`), `atuin/`, `ghostty/`, `lazygit/`, `powerline/`, `Code/`.
- **`bin/`** — a handful of standalone utility scripts.
- **Root dotfiles** — `.tmux.conf`, `.gitconfig` (+ `.gitconfig_check24`), `.p10k.zsh`, `.fzf-init.zsh`, `.zshenv`.
- **Formatter/linter configs** — `.editorconfig`, `.prettierrc.yaml`, `rustfmt.toml` are provided to `$HOME` for use by other projects; this repo has no build, lint, or test pipeline of its own.

## Rules that govern work here

`.claude/rules/` is auto-loaded and overrides default behavior. The ones most likely to affect a change in this repo:

- `file-locations.md` — skills/commands/agents/rules must be created under this repo's `.claude/`, never directly in `~/.claude/`; new agents need a manual symlink.
- `commits.md` — commit format is `{component} {emoji}: {message}` with imperative gerund messages; component is the top-level area (`claude`, `bin`, `zsh`, `git`, …). No AI attribution.
- `skill-language.md` — code/git tooling skills are written in English; personal skills that produce German output are written in German.
- `no-ai-tells.md`, `coding-discipline.md`, `editing.md` — keep changes surgical, comment-free unless the surrounding file comments, and mirror existing style.
