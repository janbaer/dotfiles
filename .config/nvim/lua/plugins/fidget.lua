-- Extensible UI for Neovim notifications and LSP progress messages
-- https://github.com/j-hui/fidget.nvim

return {
  "j-hui/fidget.nvim",
  enabled = require("core.plugin-control").is_enabled("fidget"),
  opts = {},
}
