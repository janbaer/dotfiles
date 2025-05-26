-- That displays a popup with possible keybindings of the command you started typing.
-- https://github.com/folke/which-key.nvim
return {
  "folke/which-key.nvim",
  enabled = true,
  event = "VeryLazy",
  init = function()
    vim.o.timeout = true
    vim.o.timeoutlen = 500
  end,
  opts = {},
  keys = {
    -- { "<leader>", function() require("which-key").show() end, desc = "which-key" },
  },
  config = function(_, opts)
    local wk = require("which-key")

    wk.setup(opts)

    local keys = {
      { "<leader>,", group = "Hop" },
      { "<leader>c", group = "ChatGPT" },
      { "<leader>d", group = "Debug" },
      { "<leader>f", group = "FzfLua" },
      { "<leader>g", group = "Git" },
      { "<leader>l", group = "Format/Linting" },
      -- { "<leader>s", group = "Lsp[s]aga" },
      { "<leader>s", group = "Split window" },
      { "<leader>t", group = "Telescope" },
      { "<leader>w", group = "Workspaces" },
      { "<leader>x", group = "Trouble" },
      { "gr",        group = "LSP commands" },
    }
    wk.add(keys)
  end
}
