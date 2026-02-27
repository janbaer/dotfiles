# Neovim Config Improvement Plan

## Completed

- [x] **rust-tools.nvim → rustaceanvim** — replaced deprecated plugin, updated keymaps to `:RustLsp` API

---

## Remaining Tasks

### 🔴 Critical (Deprecated / Broken)

- [x] **vim-go → modern Go tooling** — removed plugin, `<leader>gr`/`<leader>gt` now use `!go run .` / `!go test ./...`

---

### 🟡 Redundancies (Simplification)

- [ ] **Consolidate Telescope + FZF-Lua**
  - Both picker engines run in parallel — unnecessary overhead
  - Decision needed: keep one, remove the other
  - FZF-Lua is faster with fewer deps; Telescope has better ecosystem
  - Files: `lua/plugins/telescope.lua`, `lua/plugins/fzf-lua.lua`

- [ ] **Clean up disabled plugins**
  - 8 disabled entries in plugin-control.lua: `dap`, `diffview`, `chat-gpt`, `code-companion`, `gp`, `mcphub`, `lsp-saga`, `cmp-tabnine`
  - Either activate or remove their config files entirely
  - File: `lua/core/plugin-control.lua`

---

### 🟢 Missed Modern Features

- [x] **flash.nvim instead of hop.nvim** — tried, reverted; hop's "label all words" UX preferred

- [ ] **Verify mason-lspconfig v2 handler behaviour**
  - `after/lsp/*.lua` already use new `vim.lsp.Config` table format — no `require('lspconfig').setup{}` calls anywhere
  - nvim-lspconfig is intentionally kept as a server definition library (ships `lsp/` configs for all servers)
  - Old `setup{}` API is deprecated and will be removed — confirm it's not being used anywhere
  - Verify all 13 servers start correctly with `:LspInfo` — mason-lspconfig v2 removed the default auto-handler
  - If servers are missing: explicitly call `vim.lsp.enable({...})` for each server in mason.lua

- [x] **oil.nvim alongside nvim-tree** — tried previously, not useful

- [x] **Extend mini.lua with mini.ai and mini.surround** — already configured

- [ ] **Inlay hints**
  - `vim.lsp.inlay_hint` is built-in since Neovim 0.10
  - Enable for ts_ls (TypeScript) and gopls (Go)
  - Likely in `after/lsp/ts_ls.lua` and `after/lsp/gopls.lua`

- [x] **Replace vim-cutlass with native keymaps** — removed plugin, `d`/`x` now use `"_d` directly

- [ ] **Consider enabling mcphub.nvim**
  - Currently disabled — but given heavy Claude Code usage, direct MCP server connections from Neovim could be useful
  - File: `lua/core/plugin-control.lua` → set `["mcphub"] = true`
