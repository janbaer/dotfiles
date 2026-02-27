-- Go specific settings
vim.bo.expandtab = false -- In Go we need real tabs instead of spaces
vim.bo.preserveindent = true
vim.bo.tabstop = 2
vim.bo.shiftwidth = 2
vim.bo.softtabstop = 2
vim.keymap.set('n', '<leader>gr', '<cmd>FloatermNew --autoclose=0 go run .<cr>', { buffer = true })
vim.keymap.set('n', '<leader>gt', '<cmd>FloatermNew --autoclose=0 go test ./...<cr>', { buffer = true })
