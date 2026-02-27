# Neovim Config Improvement Plan

## Completed

- [x] **rust-tools.nvim → rustaceanvim** — replaced deprecated plugin, updated keymaps to `:RustLsp` API

---

## Remaining Tasks

### 🔴 Critical (Deprecated / Broken)

- [ ] **vim-go → modern Go tooling**
  - vim-go is heavy and overlaps with gopls
  - Replace with: `nvim-dap-go` for debugging + let gopls handle everything else
  - File: `lua/plugins/plugins.lua` (simple plugin list)

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

- [ ] **flash.nvim instead of hop.nvim**
  - `folke/flash.nvim` has largely superseded hop
  - Adds Treesitter integration, remote operators (e.g. `yr<flash>` = yank remote), f/t enhancement
  - File: `lua/plugins/hop.lua` → replace

- [ ] **Native LSP config (Neovim 0.11+)**
  - Neovim 0.11 introduced `vim.lsp.config` and `vim.lsp.enable()`
  - Could fully replace nvim-lspconfig — no plugin needed
  - Check current Neovim version first: `:version`
  - Files: `lua/plugins/mason.lua`, `after/lsp/`

- [ ] **oil.nvim alongside nvim-tree**
  - `stevearc/oil.nvim`: edit directories like a buffer (rename/delete/move with normal vim commands)
  - Keep nvim-tree for overview, add oil for file operations
  - No existing file — new plugin entry needed

- [ ] **Extend mini.lua with mini.ai and mini.surround**
  - `mini.ai`: improved text objects for functions, arguments, etc.
  - `mini.surround`: actively maintained surround plugin (replaces vim-surround)
  - File: `lua/plugins/mini.lua`

- [ ] **Inlay hints**
  - `vim.lsp.inlay_hint` is built-in since Neovim 0.10
  - Enable for ts_ls (TypeScript) and gopls (Go)
  - Likely in `after/lsp/ts_ls.lua` and `after/lsp/gopls.lua`

- [ ] **Replace vim-cutlass with native keymaps**
  - `d`/`x` without polluting yank register is achievable with `"_d` mappings
  - No plugin needed — remove vim-cutlass, add a few lines to `lua/core/keymaps.lua`

- [ ] **Consider enabling mcphub.nvim**
  - Currently disabled — but given heavy Claude Code usage, direct MCP server connections from Neovim could be useful
  - File: `lua/core/plugin-control.lua` → set `["mcphub"] = true`
