return {
  "goolord/alpha-nvim",
  enabled = false,
  dependencies = { "nvim-tree/nvim-web-devicons" },
  config = function()
    require("alpha").setup(require("alpha.themes.startify").config)
    vim.cmd("cnoreabbrev db Alpha!")
    vim.keymap.set("n", "<C-H>", "<cmd>Alpha<CR>", { desc = "Show dashboard" })
  end,
}
