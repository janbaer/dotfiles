-- Gp.nvim (GPT prompt) Neovim AI plugin: ChatGPT sessions & Instructable text/code operations & Speech to text [OpenAI, Ollama, Anthropic, ..]
-- https://github.com/Robitx/gp.nvim
-- https://github.com/exosyphon/nvim/blob/main/lua/plugins/gp.lua
return {
  "robitx/gp.nvim",
  lazy = false,
  enabled = true,
  opts = {
    providers = {
      openai = {
        endpoint = "https://api.openai.com/v1/chat/completions",
        secret = os.getenv("OPENAI_API_KEY"),
      },
      -- anthropic = {
      --   endpoint = "https://api.anthropic.com/v1/messages",
      --   secret = os.getenv("ANTHROPIC_API_KEY"),
      -- },
    },
    hooks = {
      -- example of usig enew as a function specifying type for the new buffer
      CodeReview = function(gp, params)
        local template = "I have the following code from {{filename}}:\n\n"
            .. "```{{filetype}}\n{{selection}}\n```\n\n"
            .. "Please analyze for code smells and suggest improvements."
        local agent = gp.get_chat_agent()
        gp.Prompt(params, gp.Target.enew("markdown"), agent, template)
      end,
      Explain = function(gp, params)
        local template = "I have the following code from {{filename}}:\n\n"
            .. "```{{filetype}}\n{{selection}}\n```\n\n"
            .. "Please respond by explaining the code above."
        local agent = gp.get_chat_agent()
        gp.Prompt(params, gp.Target.popup, agent, template)
      end,
      -- example of making :%GpChatNew a dedicated command which
      -- opens new chat with the entire current buffer as a context
      BufferChatNew = function(gp, _)
        -- call GpChatNew command in range mode on whole buffer
        vim.api.nvim_command("%" .. gp.config.cmd_prefix .. "ChatNew")
      end,
    }
  },
  config = function(_, opts)
    require("gp").setup(opts)
  end,
}
