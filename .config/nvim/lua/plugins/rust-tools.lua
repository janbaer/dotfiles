-- Modern Rust development tools for Neovim
-- Successor to deprecated rust-tools.nvim
-- See https://github.com/mrcjkb/rustaceanvim

return {
  "mrcjkb/rustaceanvim",
  enabled = require("core.plugin-control").is_enabled("rustaceanvim"),
  version = "^5",
  ft = "rust",
  init = function()
    vim.g.rustaceanvim = {
      server = {
        on_attach = function(_, bufnr)
          vim.keymap.set("n", "<Leader>rha", function()
            vim.cmd.RustLsp({ "hover", "actions" })
          end, { buffer = bufnr })
          vim.keymap.set("n", "<Leader>rca", function()
            vim.cmd.RustLsp("codeAction")
          end, { buffer = bufnr })
        end,
      },
    }
  end,
}
