-- Plugin to improve viewing Markdown files in Neovim
-- https://github.com/MeanderingProgrammer/render-markdown.nvim
return {
  'MeanderingProgrammer/render-markdown.nvim',
  enabled = true,
  opts = {},
  dependencies = { 'nvim-treesitter/nvim-treesitter', 'echasnovski/mini.nvim' }, -- if you use the mini.nvim suite
}
