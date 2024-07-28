-- Cody is an AI coding assistant that helps you understand, write, and fix code faster
-- https://sourcegraph.com/docs/cody/clients/install-neovim
-- After first installation execute `:SourcegraphLogin`
return {
  {
    "sourcegraph/sg.nvim",
    enabled = true,
    dependencies = { "nvim-lua/plenary.nvim" },
  },
}
