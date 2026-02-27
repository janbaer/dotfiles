# Neovim Config Improvement Plan

## Completed

- [x] **rust-tools.nvim → rustaceanvim** — replaced deprecated plugin, updated keymaps to `:RustLsp` API

---

## Remaining Tasks

### 🔴 Critical (Deprecated / Broken)

- [x] **vim-go → modern Go tooling** — removed plugin, `<leader>gr`/`<leader>gt` now use `!go run .` / `!go test ./...`

---

### 🟡 Redundancies (Simplification)

- [x] **Consolidate Telescope + FZF-Lua** — keeping both intentionally; each has unique features (e.g. FZF-Lua colorscheme preview)

- [x] **Clean up disabled plugins** — removed cmp-tabnine, code-companion, chat-gpt, gp, lsp-saga, diffview, rust-tools.lua leftover; dap and mcphub kept disabled

---

### 🟢 Missed Modern Features

- [x] **flash.nvim instead of hop.nvim** — tried, reverted; hop's "label all words" UX preferred

- [x] **Verify mason-lspconfig v2 handler behaviour** — all servers confirmed active in :LspInfo; after/lsp/*.lua already use new vim.lsp.Config format

- [x] **oil.nvim alongside nvim-tree** — tried previously, not useful

- [x] **Extend mini.lua with mini.ai and mini.surround** — already configured

- [x] **Inlay hints** — enabled globally in LspAttach for all supporting servers, toggle with `<leader>lh`

- [x] **Replace vim-cutlass with native keymaps** — removed plugin, `d`/`x` now use `"_d` directly

- [x] **Consider enabling mcphub.nvim** — removed; claude-code.nvim already covers this use case
