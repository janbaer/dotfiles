-- Portable package manager for Neovim that runs everywhere Neovim runs.
-- https://github.com/williamboman/mason.nvim
return {
  {
    "williamboman/mason-lspconfig.nvim",
    enabled = require("core.plugin-control").is_enabled("mason"),
    opts = {
      -- list of servers for mason to install
      ensure_installed = {
        "ansiblels",
        "bashls",
        -- "biome",
        "cssls",
        -- "cssmodules_ls",
        -- "copilot", -- Inline-completion will be supported with Neovim 0.12
        "dockerls",
        "emmet_ls",
        "eslint",
        "gopls",
        "html",
        "lua_ls",
        "marksman",
        -- "nil_ls",
        -- "nixd",
        -- "nushell",
        "svelte",
        -- "tailwindcss",
        "terraformls",
        "ts_ls",
        "yamlls",
      },
    },
    dependencies = {
      {
        "williamboman/mason.nvim",
        opts = {
          ui = {
            icons = {
              package_installed = "✓",
              package_pending = "➜",
              package_uninstalled = "✗",
            },
          },
        },
      },
      "neovim/nvim-lspconfig",
    },
  },
  {
    "WhoIsSethDaniel/mason-tool-installer.nvim",
    enabled = require("core.plugin-control").is_enabled("mason"),
    opts = {
      ensure_installed = {
        "alejandra",
        "ansible-lint",
        "jsonlint",
        "yamllint",
        "luacheck",
        "prettier",
        "pylint",
        "shellcheck",
        "stylua",
        "stylelint",
        "yamlfmt",
      },
    },
    dependencies = {
      "williamboman/mason.nvim",
      "rcarriga/nvim-notify",
    },
  },
}
