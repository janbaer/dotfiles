vim.cmd([[
  au FileType gitcommit set tw=100 " The default is 72 and for me it's mostly not enough

  augroup bash
    autocmd!
    autocmd BufRead .functions,.aliases set filetype=bash
    autocmd FileType bash setlocal shiftwidth=2 tabstop=2 softtabstop=2 preserveindent nowrap foldmethod=indent
    autocmd BufWinLeave *.sh,.aliases,.functions mkview
    autocmd BufWinEnter *.sh,.aliases,.functions silent! loadview
  augroup END

  augroup lua
    autocmd!
    " autocmd BufRead *.lua normal zR " When opening the file, unfold all. Fold all with zM
    autocmd FileType rust setlocal shiftwidth=2 tabstop=2 softtabstop=2 preserveindent nowrap foldmethod=indent
    autocmd BufWinLeave *.lua mkview
    autocmd BufWinEnter *.lua silent! loadview
  augroup END

  augroup rust
    autocmd!
    autocmd FileType rust setlocal shiftwidth=2 tabstop=2 softtabstop=2 preserveindent nowrap foldmethod=indent
    autocmd FileType rust compiler cargo
    autocmd FileType rust lua vim.keymap.set('n', '<leader>rr', '<cmd>RustRunnables<cr>')
    autocmd FileType rust lua vim.keymap.set('n', '<leader>rf', '<cmd>lua vim.lsp.buf.format({ async = true })<cr>')
    " autocmd FileType rust lua vim.keymap.set('n', '<leader>rb', '<cmd>Make build<cr>')
    " autocmd BufWritePre *.rs lua vim.lsp.buf.format({ async = true })
    " autocmd BufRead *.rs normal zR " When opening the file, unfold all. Fold all with zM
    autocmd BufWinLeave *.rs mkview
    autocmd BufWinEnter *.rs silent! loadview
  augroup END

  augroup markdown
    autocmd!
    autocmd FileType markdown setlocal shiftwidth=2 tabstop=2 softtabstop=2 preserveindent wrap foldmethod=manual
    autocmd FileType markdown setlocal spell spelllang=de,en spellfile=~/Projects/dotfiles/.config/nvim/spell/de.utf-8.add
    autocmd BufWinLeave *.md mkview
    autocmd BufWinEnter *.md silent! loadview
  augroup END

  augroup yamlFile
    autocmd!
    autocmd BufNewFile,BufRead .ansiblelint,.yamlint set filetype=yaml
    autocmd BufNewFile,BufRead .y*ml.j2 set filetype=yaml " Jinja2 templates
    autocmd Filetype yaml set cursorcolumn
    autocmd BufWinLeave *.y*ml mkview
    autocmd BufWinEnter *.y*ml silent! loadview
  augroup END
]])
