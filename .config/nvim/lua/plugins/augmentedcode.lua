-- AI-augmented development in Vim and Neovim
-- https://github.com/augmentcode/augment.vim
return {
  "augmentcode/augment.vim",
  enabled = true,
  event = "VeryLazy",
  keys = {
    { "<leader>ac",  "<cmd>Augment chat<cr>",        desc = "Augment chat" },
    { "<leader>acn", "<cmd>Augment chat-new<cr>",    desc = "Augment new chat" },
    { "<leader>act", "<cmd>Augment chat-toggle<cr>", desc = "Augment toggle chat" },
  },
}
