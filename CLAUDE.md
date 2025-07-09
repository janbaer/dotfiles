# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is Jan's personal dotfiles repository containing system configurations, scripts, and Neovim setup for a Linux desktop environment (Manjaro/Hyprland).

## Architecture

### Core Components

- **Neovim Configuration** (`.config/nvim/`): Lua-based configuration using lazy.nvim plugin manager
  - Core modules: `core/lsp.lua`, `core/options.lua`, `core/keymaps.lua`, `core/functions.lua`, `core/autocmd.lua`
  - Plugins: Organized in `lua/plugins/` directory with lazy loading
  - LSP configurations: Language-specific configs in `lsp/` directory
  - File-type plugins: `ftplugin/` for language-specific settings

- **System Scripts** (`bin/`): Utility scripts for system management
  - Display management (mirror-display.sh, toggle-notebook-screen.sh)
  - Backup utilities (backup-secure-data.sh, rsync-*.sh)
  - Hardware controls (backlight-ctl.sh, pa-volume-ctl.sh)
  - System utilities (slowtype.sh, curltime)

- **Desktop Environment** (`.config/`): Hyprland window manager configuration
  - Waybar configuration with custom scripts
  - Rofi launcher configurations
  - Notification daemon (swaync)
  - Terminal emulator (kitty)

### Key Configuration Files

- `sync.sh`: Main synchronization script for deploying dotfiles
- `rustfmt.toml`: Rust code formatting configuration
- `.config/nvim/init.lua`: Neovim entry point with lazy.nvim bootstrap
- `.config/hypr/hyprland.conf`: Hyprland window manager configuration
- `.config/waybar/config.jsonc`: Status bar configuration

## Common Development Tasks

### Deployment
```bash
./sync.sh
```
Synchronizes dotfiles to home directory, creates nvim symlink, and recompiles German spell files.

### Neovim Setup
```bash
.config/nvim/setup.sh
```
Initial Neovim configuration setup script.

### Neovim Cleanup
```bash
.config/nvim/cleanup-nvim.sh
```
Cleans up Neovim configuration and data.

### Rust Formatting
Uses `rustfmt.toml` configuration with 2-space indentation and 100-character line width.

## Development Environment

- **Primary Editor**: Neovim with extensive LSP support
- **Terminal**: Kitty terminal emulator
- **Shell**: Zsh with custom configurations
- **Window Manager**: Hyprland (Wayland compositor)
- **File Manager**: lf (terminal-based)

## Neovim Plugin Architecture

The Neovim configuration uses lazy.nvim for plugin management with:
- Automatic plugin loading from `lua/plugins/`
- LSP configurations for multiple languages
- Custom keymaps and functions
- Language-specific settings via ftplugin

## System Integration

Scripts in `bin/` provide system-level functionality:
- Hardware control (brightness, volume, displays)
- Data backup and synchronization
- System utilities and automation

The configuration is designed for a Linux desktop environment with focus on keyboard-driven workflows and terminal-based development.