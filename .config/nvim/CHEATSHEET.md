# Neovim command and keybind cheat sheet

## BASICS

- `<Space>` leader key
- `:checkhealth [<pluginname>]` check base or plugin status
- `:checkhealth vim.lsp` show details of LSP attached to buffer
- `:verbose set expandtab?` check where `expandtab` has been set last
- `:Lazy` show package manager UI
- `:Mason` show Mason UI
- `:TSUpdate` update all Tree-sitter parsers
- `:LspInfo` show attached LSP client details
- `:ConformInfo` useful to debug why a formatter times out
- `:Format` format current buffer with conform.nvim

## NAVIGATING

## Windows, splits & tabs

- `<Ctrl>+wq` close window
- `<leader>sh` split window **horizontally**
- `<leader>sv` split window **vertically**
- `<Ctrl>+h/j/k/l` move between split windows
- `<leader>se` equalize split window width and height
- `<Ctrl>+wr` swap position of two windows
- `<Ctrl>+wT` move active split window to new tab
- `<F6>` switch between windows
- `<F8>` open new tab
- `<S-Tab>` switch to next tab

## Buffers

- `<leader>b` lists open buffers in telescope
- `<leader>fb` lists open buffers in fzf-lua
- `:bd` close current buffer
- `:bn/p` go to next/previous buffer

## Text

- `w/e` move to **start/end of next word**
- `b` move to **start of previous word**
- `<Ctrl>+0` start of line
- `<Ctrl>+$` end of line
- `<Ctrl>+d/u` scroll down/up 1/2 page while keeping the cursor centered
- `<Ctrl>+o` jump to location you were before (e.g. after using `gg`)
- `<Ctrl>+i` jump back to location you were before (after using `Ctrl`+`o`)
- `<Space>` fold/unfold current text
- `<leader>aa` select all text (ggVG)
- `<leader>h` toggle highlight search
- `k`/`j` smart line navigation (considers word wrap)

## LSP, Code & Diagnostics

- `<C-k>`/`<C-j>` scroll up/down through LSP suggestions (in blink.cmp)
- `<S-Tab>`/`<Tab>` select previous/next completion item
- `<CR>` accept completion
- `<C-space>` show completion menu
- `<C-c>` cancel completion
- `K` show LSP context info
- `grd` go to definition
- `gr` show references of function
- `<leader>rn` rename all refs of the symbol under cursor
- `<leader>ca` code action (normal and visual mode)
- `[d` go to previous diagnostic
- `]d` go to next diagnostic

## Telescope

- `<C-p>` find files
- `<leader>?` find recently opened files
- `<leader>b` find existing buffers
- `<leader>/` fuzzy search in current buffer
- `<leader>tf` search frequently used files (frecency)
- `<leader>th` search help tags
- `<leader>tg` live grep search
- `<leader>td` search diagnostics
- `<leader>ts` resume last search
- `<leader>tt` show Telescope
- `<leader>tp` Telescope neoclip
- `<leader>tr` Telescope repos

### Telescope navigation
- `<C-k>`/`<C-j>` move selection up/down
- `<C-h>` show which-key help
- `<C-w>` send selected to quickfix
- `<C-q>` send all to quickfix
- `<C-v>` open file in **vertical** split
- `<C-x>` open file in **horizontal** split
- `<C-t>` open file in new tab

## FZF-Lua

- `<C-S-P>` FZF files
- `<leader>fc` FZF commands
- `<leader>fb` FZF buffers
- `<leader>fm` FZF marks
- `<leader>fg` FZF grep project
- `<leader>fr` FZF registers
- `<leader>fs` FZF colorschemes

## Nvim-Tree (File Explorer)

- `<C-t>` toggle file explorer
- `<leader>tl` find current file in explorer

### Nvim-Tree navigation (when open)
- `?` toggle help
- `v` open in vertical split
- `s` open in vertical split (NerdTree style)

## Trouble (Diagnostics)

- `<leader>xx` toggle diagnostics
- `<leader>xX` toggle buffer diagnostics
- `<leader>cs` toggle symbols
- `<leader>cl` LSP definitions/references
- `<leader>xL` location list
- `<leader>xQ` quickfix list
- `<leader>xc` close quickfix window

## Hop (Quick Navigation)

- `<leader>,w` hop to word
- `<leader>,b` hop to word backwards
- `<leader>,p` hop to pattern
- `<leader>,e` hop to specific character

## EDITING

### Code editing

- `<leader>lf` format whole file or visual selection with conform.nvim
- `i` insert mode at cursor position
- `I` insert mode at **beginning of line**
- `a` insert mode **after the current char**
- `A` insert mode at **end of line**
- `o` insert mode a line **below** the cursor
- `O` insert mode a line **above** the cursor
- `cw` replace the current word
- `cc` replace whole line
- `C` replace to the end of the line
- `yy` copy the current line
- `yap` "yank-around-paragraph"
- `yip` "yank-inside-paragraph"
- `yaW` copy word w/ dashes/underscores
- `p/P` paste yanked line below/above
- `x` cut (mapped to delete)
- `xx` cut whole line
- `<DEL>` delete without yanking
- `W` save all changes
- `[<space>` add empty line above cursor
- `]<space>` add empty line below cursor

### Quick pairs (insert mode)
- `<leader>'` insert ''
- `<leader>"` insert ""
- `<leader>`` insert ``
- `<leader>(` insert ()
- `<leader>[` insert []
- `<leader>{` insert {}
- `<leader>{{` insert {{}}

## SELECTING

### Visual mode

- `v` at cursor position
- `V` line mode
- `<Ctrl>+v` block mode
- `vap` "visual-select-around-paragraph"
- `vip` "visual-select-inside-paragraph"
- `v` expand selection (in visual mode)

### Repeatable indentation
- `<` decrease indentation (stays in visual mode)
- `>` increase indentation (stays in visual mode)

## AI/CLAUDE CODE

- `<leader>ac` toggle Claude Code
- `<leader>af` focus Claude Code window
- `<leader>ar` resume Claude Code session
- `<leader>aC` continue Claude Code session
- `<leader>ab` add current buffer to Claude
- `<leader>as` send selection to Claude (visual mode)
- `<leader>as` add file from tree explorer (in NvimTree/neo-tree/oil)
- `<leader>aa` accept Claude diff
- `<leader>ad` deny Claude diff

## UTILITY COMMANDS

- `<leader>q` or `<leader>e` exit current window
- `<leader>rl` reload current buffer
- `<leader>rs` run sync.sh script
- `<leader>gb` show git blame
- `<leader>pp` toggle dark/light background
- `<leader>vv` search current word with ACK
- `<F2>` open file under cursor in vertical split
- `<F11>` toggle floaterm
- `gx` open URL under cursor in browser
- `;s` enable spell check
- `<leader>h` toggle highlight search

## SEARCH/OPEN

- `<leader>tg` live grep search in files
- `<leader>fg` FZF grep project
- `<C-p>` search files (respects `.gitignore`)
- `<C-t>` toggle file explorer
- `<leader>?` recently opened files
- `gf` open file under cursor in a new buffer
- `gx` open link under cursor in default browser
- `*` search word under cursor