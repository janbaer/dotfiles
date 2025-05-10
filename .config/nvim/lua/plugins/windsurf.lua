-- A native neovim extension for Windsurf (formerly Codeium)
-- https://github.com/Exafunction/windsurf.nvim
return {
  "Exafunction/windsurf.nvim",
  enabled = true,
  event = "VeryLazy",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "hrsh7th/nvim-cmp",
  },
  opts = {},
  config = function(_, opts)
    require("codeium").setup(opts)
  end,
}
