# CHANGELOG

This file describes all changes in the project.

## 2026-11-13
---

- Add the `agents-info` mod: subagents show by role in their own panel, with costs only for known prices and API billing. It replaces `savvy-progress`, which must be uninstalled on machines that still have it
- Add skills for Forgejo issue review, Renovate PR merges, runbooks, project handover, Hermes tasks and homelab questions; PR, merge and release now run without manual steps
- Add mods for reading answers aloud (speak), cache expiry (cache-meter), prompt routing to the right project (project-guard) and secret redaction; switch the default style to Concise
- Add rules for dates from `date`, sourced facts before prose, English-only commit history and infra root-causing; drop OpenSpec for linked requirements and design docs

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

