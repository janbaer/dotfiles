-- Improved fzf.vim written in lua
-- https://github.com/ibhagwan/fzf-lua
return {
  "ibhagwan/fzf-lua",
  enabled = true,
  -- optional for icon support
  dependencies = { "nvim-tree/nvim-web-devicons" },
  opts = {
    fzf_opts = {
      ['--layout'] = 'reverse-list',
    },
    "telescope",
    winopts = {
      preview = {
        default = "bat"
      }
    }
  },
  config = function(_, opts)
    -- calling `setup` is optional for customization
    require("fzf-lua").setup(opts)
    vim.keymap.set("n", "<C-S-P>", "<cmd>lua require('fzf-lua').files()<CR>", { silent = true, desc = "Fzf files" })

    vim.cmd("cnoreabbrev fzf FzfLua")
  end
}
