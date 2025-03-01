-- ✨ AI-powered coding, seamlessly in Neovim
-- https://github.com/olimorris/codecompanion.nvim
return {
  "olimorris/codecompanion.nvim",
  enabled = true,
  event = "VeryLazy",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-treesitter/nvim-treesitter",
  },
  opts = {
    strategies = {
      chat = {
        adapter = "anthropic",
      },
      inline = {
        adapter = "anthropic",
      },
    },
    adapters = {
      openai = function()
        return require("codecompanion.adapters").extend("openai", {
          schema = {
            model = {
              default = "gpt-4.5-preview",
            },
          },
        })
      end,
      anthropic = function()
        return require("codecompanion.adapters").extend("anthropic", {
          schema = {
            model = {
              default = "claude-3-7-sonnet-20250219",
            },
          },
          env = {
            api_key = "cmd:gopass show /cloud/anthropic/claude"
          },
        })
      end,
    },
    opts = {
      -- log_level = "DEBUG",
    },
  },
  keys = {
    { "<leader>cc",  "<cmd>CodeCompanion<cr>",        desc = "CodeCompanion" },
    { "<leader>cca", "<cmd>CodeCompanionActions<cr>", desc = "CodeCompanionActions" },
    { "<leader>ccc", "<cmd>CodeCompanionChat<cr>",    desc = "CodeCompanionChat" },
  },
}
