-- ✨ AI-powered coding, seamlessly in Neovim
-- https://github.com/olimorris/codecompanion.nvim
return {
  "olimorris/codecompanion.nvim",
  enabled = false,
  event = "VeryLazy",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-treesitter/nvim-treesitter",
  },
  opts = {
    display = {
      action_palette = {
        width = 95,
        height = 10,
        prompt = "Prompt ",                   -- Prompt used for interactive LLM calls
        provider = "default",                 -- Can be "default", "telescope", "fzf_lua", "mini_pick" or "snacks". If not specified, the plugin will autodetect installed providers.
        opts = {
          show_default_actions = true,        -- Show the default actions in the action palette?
          show_default_prompt_library = true, -- Show the default prompt library in the action palette?
        },
      },
      chat = {
        intro_message = "Welcome to CodeCompanion ✨! Press ? for options",
        show_header_separator = false, -- Show header separators in the chat buffer? Set this to false if you're using an external markdown formatting plugin
        separator = "─", -- The separator between the different messages in the chat buffer
        show_references = true, -- Show references (from slash commands and variables) in the chat buffer?
        show_settings = false, -- Show LLM settings at the top of the chat buffer?
        show_token_count = true, -- Show the token count for each response?
        start_in_insert_mode = false, -- Open the chat buffer in insert mode?
        -- Change the default icons
        icons = {
          pinned_buffer = " ",
          watched_buffer = "👀 ",
        },

        -- Alter the sizing of the debug window
        debug_window = {
          ---@return number|fun(): number
          width = vim.o.columns - 5,
          ---@return number|fun(): number
          height = vim.o.lines - 2,
        },

        -- Options to customize the UI of the chat buffer
        window = {
          layout = "vertical", -- float|vertical|horizontal|buffer
          position = nil,      -- left|right|top|bottom (nil will default depending on vim.opt.plitright|vim.opt.splitbelow)
          border = "single",
          height = 0.8,
          width = 0.45,
          relative = "editor",
          full_height = true, -- when set to false, vsplit will be used to open the chat buffer vs. botright/topleft vsplit
          opts = {
            breakindent = true,
            cursorcolumn = false,
            cursorline = false,
            foldcolumn = "0",
            linebreak = true,
            list = false,
            numberwidth = 1,
            signcolumn = "no",
            spell = false,
            wrap = true,
          },
        },

        ---Customize how tokens are displayed
        ---@param tokens number
        ---@param adapter CodeCompanion.Adapter
        ---@return string
        token_count = function(tokens, adapter)
          return " (" .. tokens .. " tokens)"
        end,
      },
    },
    strategies = {
      chat = {
        adapter = "anthropic",
        tools = {
          opts = {
            auto_submit_errors = false,  -- Send any errors to the LLM automatically?
            auto_submit_success = false, -- Send any successful output to the LLM automatically?
          },
        }
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
              default = "claude-sonnet-4-20250514",
            },
          },
          env = {
            api_key = "cmd:gopass show /cloud/anthropic/claude",
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
