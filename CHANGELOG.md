# CHANGELOG

This file describes all changes in the project.

## 2026-08-01
---

- Remove configs that home-manager already owns or that nothing reads anymore (nushell, stylua, eslintrc, codespellignore, empty gitattributes)
- Update CLAUDE.md accordingly

## 2026-07-17
---

- Remove the Neovim config — it now lives in its own dedicated repo
- Remove obsolete files no longer in use (ctags, moc, pylintrc, dev tmux config, and several one-off `bin/` scripts)
- Update CLAUDE.md to drop references to the removed Neovim and desktop setup

## 2025-10-26
---

- Remove no longer needed configuration folders and files (48 files cleanup)
  - Removed old ackrc, TabNine, and dunst configurations
  - Cleaned up Hyprland config files (hypridle, hyprlock, hyprpaper, keybindings, windowrules)
  - Removed Hyprland helper scripts (cliphist, xdg)
  - Deleted duplicate rofi configurations and themes
  - Removed kitty theme and configuration
  - Cleaned up libinput-gestures, nsxiv, swappy configs
  - Removed notification daemon (swaync) configuration
  - Deleted waybar configuration and scripts
  - Removed wlogout configuration and icons
  - Cleaned up zathura configuration
  - Removed wallpaper file and sync script cleanup

