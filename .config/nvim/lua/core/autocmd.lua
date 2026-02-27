-- Deactivate all events with `set ei=all`, and back with `set ei=""`,w

local create_augroup = vim.api.nvim_create_augroup
local create_autocmd = vim.api.nvim_create_autocmd

-- Function to handle view operations
-- This brings the feature that Neovim remembers where exactly left the current file
-- Neovim will jump back to this position when the file will be loaded again
local function handle_view_operations(event)
  if vim.fn.expand('%') ~= '' then
    if event == "BufWinLeave" then
      vim.cmd('silent! mkview')
    elseif event == "BufWinEnter" then
      vim.cmd('silent! loadview')
    end
  end
end

-- [[ Highlight on yank ]]
-- See `:help vim.highlight.on_yank()`
local highlight_group = create_augroup("YankHighlight", { clear = true })
create_autocmd("TextYankPost", {
  group = highlight_group,
  pattern = "*",
  callback = function()
    vim.highlight.on_yank()
  end,
})

-- FileType gitcommit
local git_group = create_augroup("git", { clear = true })
create_autocmd("FileType", {
  group = git_group,
  pattern = "gitcommit",
  callback = function()
    vim.bo.textwidth = 100
  end
})

-- Bash autocmd group
local bash_group = create_augroup("bash", { clear = true })
create_autocmd("BufRead", {
  group = bash_group,
  pattern = { ".functions", ".aliases", ".exports" },
  callback = function()
    vim.bo.filetype = "bash"
  end
})
create_autocmd({ "BufWinLeave", "BufWinEnter" }, {
  group = bash_group,
  pattern = { "*.sh", ".aliases", ".functions", ".exports" },
  callback = function(args)
    handle_view_operations(args.event)
  end
})

-- Lua autocmd groupG
local lua_group = create_augroup("lua", { clear = true })
create_autocmd("BufWritePre", {
  group = lua_group,
  pattern = "*.lua",
  callback = function()
    vim.lsp.buf.format({ async = false })
  end
})
create_autocmd({ "BufWinLeave", "BufWinEnter" }, {
  group = lua_group,
  pattern = "*.lua",
  callback = function(args)
    handle_view_operations(args.event)
  end
})

-- Rust autocmd group
local rust_group = create_augroup("rust", { clear = true })
create_autocmd("BufWritePre", {
  group = rust_group,
  pattern = "*.rs",
  callback = function()
    vim.lsp.buf.format({ async = false })
  end
})
create_autocmd({ "BufWinLeave", "BufWinEnter" }, {
  group = rust_group,
  pattern = "*.rs",
  callback = function(args)
    handle_view_operations(args.event)
  end
})

-- Markdown autocmd group
local markdown_group = create_augroup("markdown", { clear = true })
create_autocmd({ "BufWinLeave", "BufWinEnter" }, {
  group = markdown_group,
  pattern = "*.md",
  callback = function(args)
    handle_view_operations(args.event)
  end
})

-- Filetype detection for compound filetypes not recognized by default
vim.filetype.add({
  extension = {
    tfvars = "terraform-vars",
    mdx = "markdown.mdx",
  },
  filename = {
    ["docker-compose.yml"] = "yaml.docker-compose",
    ["docker-compose.yaml"] = "yaml.docker-compose",
    ["compose.yml"] = "yaml.docker-compose",
    ["compose.yaml"] = "yaml.docker-compose",
    [".gitlab-ci.yml"] = "yaml.gitlab",
  },
})

-- YAML autocmd group
local yaml_group = create_augroup("yamlFile", { clear = true })
create_autocmd({ "BufNewFile", "BufRead" }, {
  group = yaml_group,
  pattern = { ".ansiblelint", ".yamlint", ".y*ml.j2" },
  callback = function()
    vim.bo.filetype = "yaml"
  end
})
create_autocmd({ "BufWinLeave", "BufWinEnter" }, {
  group = yaml_group,
  pattern = "*.y*ml",
  callback = function(args)
    handle_view_operations(args.event)
  end
})

-- Go autocmd group
local go_group = create_augroup("golang", { clear = true })
create_autocmd({ "BufWinLeave", "BufWinEnter" }, {
  group = go_group,
  pattern = "*.go",
  callback = function(args)
    handle_view_operations(args.event)
  end
})
create_autocmd(
  "LspAttach",
  { --  Use LspAttach autocommand to only map the following keys after the language server attaches to the current buffer
    group = vim.api.nvim_create_augroup("UserLspConfig", {}),
    callback = function(ev)
      vim.bo[ev.buf].omnifunc = "v:lua.vim.lsp.omnifunc" -- Enable completion triggered by <c-x><c-o>

      -- Buffer local mappings.
      -- See `:help vim.lsp.*` for documentation on any of the below functions
      local opts = { buffer = ev.buf }
      vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
      vim.keymap.set("n", "gD", vim.lsp.buf.declaration, opts)
      vim.keymap.set("n", "<leader><space>", vim.lsp.buf.hover, opts)
      vim.keymap.set("n", "gi", vim.lsp.buf.implementation, opts)
      vim.keymap.set("n", "<leader>D", vim.lsp.buf.type_definition, opts)
      -- vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
      vim.keymap.set({ "n", "v" }, "<leader>ca", vim.lsp.buf.code_action, opts)
      vim.keymap.set("n", "gr", vim.lsp.buf.references, opts)

      -- Open the diagnostic under the cursor in a float window
      vim.keymap.set("n", "<leader>d", function()
        vim.diagnostic.open_float({
          border = "rounded",
        })
      end, opts)

      -- Inlay hints: off by default, toggle with <leader>lh
      local client = vim.lsp.get_client_by_id(ev.data.client_id)
      if client and client.supports_method("textDocument/inlayHint") then
        vim.lsp.inlay_hint.enable(false, { bufnr = ev.buf })
        vim.keymap.set("n", "<leader>lh", function()
          vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled({ bufnr = ev.buf }), { bufnr = ev.buf })
        end, vim.tbl_extend("force", opts, { desc = "Toggle inlay hints" }))
      end
    end,
  }
)
