-- Seamless integration between Claude Code AI assistant and Neovim
-- https://github.com/greggh/claude-code.nvim
return {
  "greggh/claude-code.nvim",
  enabled = require("core.plugin-control").is_enabled("claude-code"),
  dependencies = {
    "nvim-lua/plenary.nvim", -- Required for git operations
  },
  config = function()
    require("claude-code").setup()
  end
}
