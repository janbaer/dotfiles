# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Jan's personal dotfiles: shell, terminal, git, and Claude Code configuration for his Linux and macOS machines. The Neovim setup and the Hyprland desktop environment (waybar, kitty, rofi, swaync, wlogout) previously lived here but have been removed — Neovim now lives in a separate `neovim-config` project. Do not reintroduce references to them.

## Deployment model (important)

There is **no** `sync.sh`, install script, or build step. This repo is the source of truth; deployment happens through NixOS **home-manager**, which symlinks files from here into `$HOME` and `~/.claude/`. The home-manager configuration itself lives in a separate NixOS repo, not here.

Consequences when editing:

- Editing a file in this repo is live immediately on the current machine. `~/.claude/commands/`, `~/.claude/skills/`, `~/.claude/rules/`, `~/.claude/agents/` resolve through the nix store back into `.claude/` here (`mkOutOfStoreSymlink`), so the store holds the pointer, not a copy. No sync step, no switch. A running session still needs a restart to re-read what it loads at startup.
- Machine-local secrets (`.claude/settings.json`, `.zshrc.local`, `.zshrc.secrets`, OAuth/MCP credentials) are git-ignored and stay out of this repo.

## Structure

Many skills under `.claude/skills/` are external and git-ignored — only Jan's own are tracked here. `.claude/rules/` is auto-loaded into every session and overrides default behavior; `.claude/knowledge-base/` holds Jan's coding preferences and is read on demand.

The shell config lives in `.config/zsh/` (`ZDOTDIR=$HOME/.config/zsh`), not in a `~/.zshrc`. The repo has no build, lint, or test pipeline of its own — `.editorconfig`, `.prettierrc.yaml` and `rustfmt.toml` are only provided to `$HOME` for other projects.
