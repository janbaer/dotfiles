local opt = vim.opt

-- Setting verbosefile and verbose
-- vim.o.verbosefile = '~/tmp/nvim-messages.log'
-- vim.o.verbose = 9

-- Session Management
opt.sessionoptions = "blank,buffers,curdir,folds,help,tabpages,winsize,winpos,terminal,localoptions"

-- Line Numbers
opt.relativenumber = true
opt.number = true

-- Tabs & Indentation
opt.tabstop = 2
opt.shiftwidth = 2
opt.expandtab = true
opt.autoindent = true

-- Line Wrapping
opt.wrap = false

-- Search Settings
opt.ignorecase = true
opt.smartcase = true

-- Cursor Line
opt.cursorline = true

-- Appearance
opt.termguicolors = true
opt.background = "dark"
opt.signcolumn = "yes"

-- Backspace
opt.backspace = "indent,eol,start"

-- Clipboard
-- opt.clipboard:append("unnamedplus")

-- Split Windows
opt.splitright = true
opt.splitbelow = true

-- Consider - as part of keyword
opt.iskeyword:append("-")

-- Disable the mouse while in nvim
opt.mouse = ""

-- Folding
opt.foldlevel = 20
opt.foldmethod = "expr"
opt.foldexpr = "nvim_treesitter#foldexpr()" -- Utilize Treesitter folds

-- #######################
-- [[ Setting options ]]
-- See `:help vim.o`

-- Set highlight on search
vim.o.hlsearch = false

-- Make line numbers default
vim.wo.number = true

-- Enable mouse mode
vim.o.mouse = "a"

-- Enable break indent
vim.o.breakindent = true

-- Save undo history
vim.o.undofile = true

-- Case insensitive searching UNLESS /C or capital in search
vim.o.ignorecase = true
vim.o.smartcase = true

-- Decrease update time
vim.o.updatetime = 250
vim.wo.signcolumn = "yes"

-- Set completeopt to have a better completion experience
vim.o.completeopt = "menuone,noselect"

vim.opt.tabstop = 2
vim.opt.softtabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = false
vim.opt.backup = false

vim.opt.scrolloff = 8

vim.opt.wrap = false

vim.opt.backup = false
vim.opt.writebackup = false
vim.opt.swapfile = false

vim.o.listchars = "space:·,trail:·,precedes:«,extends:»,eol:↲,tab:▸▸"
vim.opt.list = true

vim.opt.wildignore = { ".git", ".vscode", "node_modules", "target" }

vim.opt.relativenumber = false

vim.g.NERDTreeShowHidden = 1
vim.g.NERDTreeRespectWildIgnore = 1

-- Settings for ACK plugin
vim.g.ackprg = "rg -S --no-heading --hidden --vimgrep"
vim.cmd("cnoreabbrev ag Ack!")
vim.cmd("cnoreabbrev rg Ack!")
vim.cmd("cnoreabbrev ack Ack!")

-- vim-router
vim.g.rooter_cd_cmd = "lcd"

-- Set my preferred colorscheme
-- require('material.functions').change_style('palenight')
vim.o.termguicolors = true
vim.cmd("colorscheme catppuccin")

-- Configurations for Showing LSP diagnostic results
-- https://neovim.io/doc/user/diagnostic.html
vim.diagnostic.config({
  virtual_text = true,      -- Use virtual text for diagnostics
  virtual_lines = false,    -- Use virtual lines for diagnostics.
  -- signs = true,       --  Use signs for diagnostics
  underline = true,         --  Use underline for diagnostics.
  update_in_insert = false, -- Update diagnostics in Insert mode (if false, diagnostics are updated on InsertLeave)
  -- severity_sort false,  -- Sort diagnostics by severity. This affects the order in which signs, virtual text, and highlights are displayed
});
