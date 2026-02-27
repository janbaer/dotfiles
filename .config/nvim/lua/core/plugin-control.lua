-- Centralized plugin enable/disable control
-- Set to true to enable, false to disable
local M = {}

M.plugins = {
  -- AI/Code Completion
  ["blink.cmp"] = true,
  ["blink-compat"] = true,
  ["cmp-tabnine"] = false,
  ["code-companion"] = false,
  ["chat-gpt"] = false,
  ["gp"] = false,
  ["mcphub"] = false,
  ["windsurf"] = true,
  ["claude-code"] = true,
  ["copilot"] = true,

  -- LSP/Language Support
  ["lsp-saga"] = false,
  ["mason"] = true,
  ["conform"] = true,
  ["nvim-lint"] = true,
  ["rustaceanvim"] = true,

  -- UI/Interface
  ["snacks"] = true,
  ["lualine-nvim"] = true,
  ["which-key"] = true,
  ["noice"] = true,
  ["fidget"] = true,
  ["nvim-tree"] = true,
  ["nvim-navic"] = true,
  ["theme-plugins"] = true,
  ["render-markdown"] = true,
  ["indent-blankline-nvim"] = true,

  -- Navigation/Search
  ["telescope"] = true,
  ["telescope-frecency"] = true,
  ["fzf-lua"] = true,
  ["hop"] = true,
  ["trouble"] = true,

  -- Git
  ["git-signs"] = true,
  ["diffview"] = false,

  -- Debug/Testing
  ["dap"] = false,
  ["neotest"] = true,

  -- Editing
  ["nvim-autopairs"] = true,
  ["nvim-treesitter"] = true,
  ["nvim-neoclip"] = true,
  ["mini"] = true,

  -- Simple plugins (from plugins.lua)
  ["vim-svelte"] = true,
  ["vim-haproxy"] = true,
  ["ack.vim"] = true,
  ["vim-maximizer"] = true,
  ["vim-cutlass"] = true,
  ["vim-visual-multi"] = true,
  ["vim-repeat"] = true,
  ["vim-terraform"] = true,
  ["vim-floaterm"] = true,
  ["vim-expand-region"] = true,
  ["vim-fugitive"] = true,
  ["vim-sleuth"] = true,
  ["vim-go"] = true,
}

-- Helper function to check if a plugin is enabled
function M.is_enabled(plugin_name)
  return M.plugins[plugin_name] == true
end

-- Helper function to get enabled state with default
function M.get_enabled(plugin_name, default)
  local enabled = M.plugins[plugin_name]
  if enabled == nil then
    return default or false
  end
  return enabled
end

return M
