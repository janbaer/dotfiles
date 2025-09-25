-- Fully featured & enhanced replacement for copilot.vim complete with API for interacting with Github Copilot
-- https://github.com/zbirenbaum/copilot.lua
-- Calling `:Copilot auth` for Github Copilot authentication is required.
return {
  {
    "zbirenbaum/copilot.lua",
    enabled = require("core.plugin-control").is_enabled("copilot"),
    event = "VeryLazy",
    config = function()
      require("copilot").setup({
        suggestion = {
          enabled = true,
          auto_trigger = false,
          accept = false,
        },
        panel = {
          enabled = false,
        },
        filetypes = {
          markdown = true,
          help = true,
          html = true,
          javascript = true,
          typescript = true,
          ["*"] = true,
        },
      })

      vim.api.nvim_create_autocmd("User", {
        pattern = "BlinkCmpMenuOpen",
        callback = function()
          vim.b.copilot_suggestion_hidden = true
        end,
      })

      vim.api.nvim_create_autocmd("User", {
        pattern = "BlinkCmpMenuClose",
        callback = function()
          vim.b.copilot_suggestion_hidden = false
        end,
      })
    end,
  },
}
