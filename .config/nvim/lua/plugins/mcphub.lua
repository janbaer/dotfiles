-- An MCP client for Neovim that seamlessly integrates MCP servers into your editing workflow
-- with an intuitive interface for managing, testing, and using MCP servers with your favorite chat plugins.
-- https://ravitemer.github.io/mcphub.nvim/installation.html
return {
  "ravitemer/mcphub.nvim",
  enabled = true,
  dependencies = {
    "nvim-lua/plenary.nvim",
  },
  build = "volta install mcp-hub@latest", -- Installs `mcp-hub` node binary globally
  config = function()
    mcphub = require("mcphub")
    mcphub.setup()

    mcphub.add_tool("weather", {
      name = "get_weather",
      description = "Get weather info",
      handler = function(req, res)
        return res:text("Current weather: ☀️"):send()
      end,
    })
  end,
}
