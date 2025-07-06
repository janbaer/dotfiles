-- Compatibility layer for using nvim-cmp sources on blink.cmp
-- https://github.com/Saghen/blink.compat
return {
  "saghen/blink.compat",
  enabled = true,
  -- use v2.* for blink.cmp v1.*
  version = "2.*",
  -- lazy.nvim will automatically load the plugin when it's required by blink.cmp
  lazy = true,
  -- make sure to set opts so that lazy.nvim calls blink.compat's setup
  opts = {},
}
