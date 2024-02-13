-- https://github.com/tzachar/cmp-ai
return {
  'tzachar/cmp-ai',
  enabled = true,
  event = "VeryLazy",
  dependencies = 'nvim-lua/plenary.nvim',
  config = function()
    local cmp_ai = require('cmp_ai.config')

    cmp_ai:setup({
      max_lines = 1000,
      notify = false,
      notify_callback = function(msg)
        vim.notify(msg)
      end,
      run_on_every_keystroke = true,
      ignored_file_types = {
        TelescopePrompt = true,
      },
      -- provider = 'HF',
      provider = 'OpenAI',
      provider_options = {
        model = 'gpt-4',
      },
    })
  end
}
