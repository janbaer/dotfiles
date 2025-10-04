-- Portable package manager for Neovim that runs everywhere Neovim runs.
-- https://github.com/williamboman/mason.nvim

return {
  "williamboman/mason.nvim",
  enabled = require("core.plugin-control").is_enabled("mason"),
  dependencies = {
    { "rcarriga/nvim-notify" },
    { "WhoIsSethDaniel/mason-tool-installer.nvim" },
  },
  config = function()
    require("mason").setup()

    local mason_tool_installer = require("mason-tool-installer")

    -- Install required linters and formatters
    mason_tool_installer.setup({
      ensure_installed = {
        -- Required linter
        "ansible-lint",
        -- "codespell",
        "eslint_d",
        "eslint-lsp",
        "jsonlint",
        "luacheck",
        -- "nix",
        -- "pylint", -- python linter
        "shellcheck",
        "stylelint",
        "yamllint",
        -- Required formatters
        -- "trivy",
        "alejandra",
        "prettier",
        "stylua",
        "terraform-ls",
        "yaml-language-server",
        "yamlfmt",
      },
    })
  end,
}
