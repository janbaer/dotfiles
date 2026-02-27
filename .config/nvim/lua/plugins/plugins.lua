-- List of plugins without additional configurations
local plugin_control = require("core.plugin-control")

return {
  { "evanleck/vim-svelte",       ft = "svelte",      enabled = plugin_control.is_enabled("vim-svelte") },  -- Support for Svelte 3 in vim
  { "Joorem/vim-haproxy",        ft = "haproxy",     enabled = plugin_control.is_enabled("vim-haproxy") },  -- Syntaxsupport for HAProxy config files
  { "mileszs/ack.vim",           event = "VeryLazy", enabled = plugin_control.is_enabled("ack.vim") },  -- Provides support for ack and the SilverlightSearcher in vim
  { "szw/vim-maximizer",         event = "VeryLazy", enabled = plugin_control.is_enabled("vim-maximizer") },  -- Maximizes and restores the current window in Vim.
  { "mg979/vim-visual-multi",    event = "VeryLazy", enabled = plugin_control.is_enabled("vim-visual-multi") },  -- This True Sublime Text style multiple selections for Vim - https://github.com/mg979/vim-visual-multi
  { "tpope/vim-repeat",          event = "VeryLazy", enabled = plugin_control.is_enabled("vim-repeat") },  -- Enable repeating supported plugin maps with \".\"
  { "hashivim/vim-terraform",    ft = "terraform",   enabled = plugin_control.is_enabled("vim-terraform") },  -- Highlighting for Terraform
  { "voldikss/vim-floaterm",     event = "VeryLazy", enabled = plugin_control.is_enabled("vim-floaterm") },  -- Showing a floating terminal for example TIG
  { "terryma/vim-expand-region", event = "VeryLazy", enabled = plugin_control.is_enabled("vim-expand-region") },  -- Expand or reduce current selection
  { "tpope/vim-fugitive",        event = "VeryLazy", enabled = plugin_control.is_enabled("vim-fugitive") },  -- A Git wrapper so awesome, it should be illegal
  { "tpope/vim-sleuth",          event = "VeryLazy", enabled = plugin_control.is_enabled("vim-sleuth") },  -- Heuristically set buffer options - https://github.com/tpope/vim-sleuth
  { "fatih/vim-go",              ft = "go",          enabled = plugin_control.is_enabled("vim-go") },  -- Go development plugin for Vim - https://github.com/fatih/vim-go
  { "mfussenegger/nvim-ansible", lazy = false,       enabled = plugin_control.is_enabled("nvim-ansible") },  -- Filetype detection for Ansible files (sets yaml.ansible filetype)
}
