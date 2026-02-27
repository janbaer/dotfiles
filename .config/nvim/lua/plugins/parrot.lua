-- AI text operations: rewrite, grammar, custom prompts
-- https://github.com/frankroeder/parrot.nvim

return {
  "frankroeder/parrot.nvim",
  enabled = require("core.plugin-control").is_enabled("parrot"),
  dependencies = { "ibhagwan/fzf-lua", "nvim-lua/plenary.nvim" },
  event = "VeryLazy",
  keys = {
    { "<leader>p",  nil,                        desc = "Parrot AI" },
    { "<leader>pc", "<cmd>PrtChatToggle<cr>",   desc = "Toggle chat" },
    { "<leader>po", "<cmd>PrtProvider<cr>",     desc = "Select provider" },
    { "<leader>pm", "<cmd>PrtModel<cr>",        desc = "Select model" },
    { "<leader>ps", "<cmd>PrtStop<cr>",         desc = "Stop generation" },
    { "<leader>pr", "<cmd>PrtRewrite<cr>",      mode = { "n", "v" }, desc = "Rewrite selection" },
    { "<leader>pa", "<cmd>PrtAppend<cr>",       mode = { "n", "v" }, desc = "Append to selection" },
    { "<leader>pg", "<cmd>PrtGrammarCheck<cr>", mode = { "n", "v" }, desc = "Grammar check" },
    { "<leader>pe", "<cmd>PrtRephrase<cr>",     mode = { "n", "v" }, desc = "Rephrase selection" },
    { "<leader>pt", "<cmd>PrtTranslate<cr>",    mode = { "n", "v" }, desc = "Translate selection" },
  },
  config = function()
    require("parrot").setup({
      providers = {
        openrouter = {
          name = "openrouter",
          endpoint = "https://openrouter.ai/api/v1/chat/completions",
          model_endpoint = "https://openrouter.ai/api/v1/models",
          api_key = { "gopass", "show", "cloud/openrouter/nvim-parrot" },
          params = {
            chat = { temperature = 0.9, top_p = 1 },
            command = { temperature = 0.8, top_p = 1 },
          },
          topic = {
            model = "z-ai/glm-4.7-flash",
            params = { max_completion_tokens = 64 },
          },
          models = {
            "z-ai/glm-4.7-flash",
            "z-ai/glm-5",
          },
        },
      },

      toggle_target = "vsplit",
      user_input_ui = "native",
      enable_spinner = true,
      spinner_type = "dots",
      enable_preview_mode = true,
      preview_auto_apply = false,

      hooks = {
        GrammarCheck = function(parrot, params)
          local template = [[
            Your task is to carefully proofread the text below, correcting grammar, spelling, and punctuation.
            Keep the original meaning and tone. Return only the corrected text — no explanations or commentary.

            Text to proofread:
            ```{{filetype}}
            {{selection}}
            ```
          ]]
          local model_obj = parrot.get_model("command")
          parrot.Prompt(params, parrot.ui.Target.rewrite, model_obj, nil, template)
        end,

        Rephrase = function(parrot, params)
          local template = [[
            Rephrase the following text to make it clearer and more concise.
            Keep the original meaning. Return only the rephrased text.

            Text:
            ```{{filetype}}
            {{selection}}
            ```
          ]]
          local model_obj = parrot.get_model("command")
          parrot.Prompt(params, parrot.ui.Target.rewrite, model_obj, nil, template)
        end,

        Translate = function(parrot, params)
          local template = [[
            Translate the following text to English. If it is already in English, translate it to German.
            Return only the translated text.

            Text:
            ```{{filetype}}
            {{selection}}
            ```
          ]]
          local model_obj = parrot.get_model("command")
          parrot.Prompt(params, parrot.ui.Target.rewrite, model_obj, nil, template)
        end,
      },

    })
  end,
}
