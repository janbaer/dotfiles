-- List of themes, I really like

return {
  { "catppuccin/nvim",             lazy = false,       enabled = require("core.plugin-control").is_enabled("theme-plugins"), name = "catppuccin" },
  { "navarasu/onedark.nvim",       event = "VeryLazy", enabled = require("core.plugin-control").is_enabled("theme-plugins") },
  { "folke/tokyonight.nvim",       event = "VeryLazy", enabled = require("core.plugin-control").is_enabled("theme-plugins") },
  { "NLKNguyen/papercolor-theme",  event = "VeryLazy", enabled = require("core.plugin-control").is_enabled("theme-plugins") },
  { "marko-cerovac/material.nvim", event = "VeryLazy", enabled = require("core.plugin-control").is_enabled("theme-plugins") },
  { "glepnir/zephyr-nvim",         event = "VeryLazy", enabled = require("core.plugin-control").is_enabled("theme-plugins") },
  { "dracula/vim",                 event = "VeryLazy", enabled = require("core.plugin-control").is_enabled("theme-plugins") },
}
