-- A collection of small QoL plugins for Neovim
-- https://github.com/folke/snacks.nvim

return {
  "folke/snacks.nvim",
  enabled = require("core.plugin-control").is_enabled("snacks"),
  priority = 1000,
  lazy = false,
  ---@type snacks.Config
  ---@field enabled? boolean
  opts = {
    -- your configuration comes here
    -- or leave it empty to use the default settings
    -- refer to the configuration section below
    bigfile = { enabled = false },
    -- https://github.com/folke/snacks.nvim/blob/main/docs/dashboard.md
    dashboard = {
      enabled = true,
      preset = {
        keys = {
          { icon = " ", key = "f", desc = "Find File", action = ":lua Snacks.dashboard.pick('files')" },
          { icon = " ", key = "n", desc = "New File", action = ":ene | startinsert" },
          { icon = " ", key = "g", desc = "Find Text", action = ":lua Snacks.dashboard.pick('live_grep')" },
          { icon = " ", key = "r", desc = "Recent Files", action = ":lua Snacks.dashboard.pick('oldfiles')" },
          { icon = " ", key = "c", desc = "Config", action = ":lua Snacks.dashboard.pick('files', {cwd = vim.fn.stdpath('config')})" },
          { icon = " ", key = "s", desc = "Restore Session", section = "session" },
          { icon = "󰒲 ", key = "L", desc = "Lazy", action = ":Lazy", enabled = package.loaded.lazy ~= nil },
          { icon = "M ", key = "M", desc = "Mason", action = ":Mason" },
          { icon = "H ", key = "H", desc = "MCPHub", action = ":MCPHub" },
          { icon = " ", key = "q", desc = "Quit", action = ":qa" },
        },
      },
      sections = {
        { section = "header" },
        {
          pane = 2,
          icon = " ",
          desc = "Browse Repo",
          padding = 1,
          key = "b",
          action = function()
            Snacks.gitbrowse()
          end,
        },
        { section = "keys", gap = 1, padding = 1 },
        { pane = 2, icon = " ", title = "Recent Files", section = "recent_files", indent = 2, padding = 1, limit = 10 },
        { pane = 2, icon = " ", title = "Projects", section = "projects", indent = 2, padding = 1 },
        {
          pane = 2,
          icon = " ",
          title = "Git Status",
          section = "terminal",
          enabled = function()
            return Snacks.git.get_root() ~= nil
          end,
          cmd = "git status --short --branch --renames",
          height = 5,
          padding = 1,
          ttl = 5 * 60,
          indent = 3,
        },
        { section = "startup" },
      },
    },
    lazygit = { enabled = true, configurable = true },
    indent = { enabled = false },
    input = { enabled = true },
    -- https://github.com/folke/snacks.nvim/blob/main/docs/notifier.md
    notifier = { enabled = true },
    quickfile = { enabled = false },
    scroll = { enabled = false },
    statuscolumn = { enabled = false },
    words = { enabled = true },
  },
  keys = {
    { "<c-h>",       function() Snacks.dashboard() end,             desc = "Snacks dashboard" },
    { "<c-g>",       function() Snacks.lazygit() end,               desc = "Lazygit" },
    { "<leader>gf",  function() Snacks.lazygit.log_file() end,      desc = "Lazygit Log current file" },
    { "<leader>gl",  function() Snacks.lazygit.log() end,           desc = "Lazygit Log (cwd)" },
    { "<leader>sgb", function() Snacks.git.blame_line() end,        desc = "Git Blame Line" },
    { "<leader>snh", function() Snacks.notifier.show_history() end, desc = "Notification History" },
    { "<leader>snd", function() Snacks.notifier.hide() end,         desc = "Snacks Dismiss All Notifications" },
    { "<leader>sz",  function() Snacks.zen() end,                   desc = "Snacks Zen Mode" },
  },
}
