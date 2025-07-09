-- Neovim motions on speed - Replacement for vim-easymotion
-- https://github.com/hadronized/hop.nvim

return {
  "smoka7/hop.nvim",
  enabled = require("core.plugin-control").is_enabled("hop"),
  event = "VeryLazy",
  version = "*",
  opts = {},
}
