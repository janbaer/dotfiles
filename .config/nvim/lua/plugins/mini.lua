-- Library of 40+ independent Lua modules improving overall Neovim
-- https://github.com/echasnovski/mini.nvim/tree/main
return {
  'echasnovski/mini.nvim',
  enabled = true,
  config = function()
    require('mini.move').setup({
      mappings = {
        up = '<C-K>',
        down = '<C-J>',
        line_up = '<C-K>',
        line_down = '<C-J>',
      },
    })

    -- Press enter to start the jump mode
    -- https://github.com/echasnovski/mini.nvim/blob/main/readmes/mini-jump2d.md
    require('mini.jump2d').setup()

    -- Extend and create a/i textobjects
    -- https://github.com/echasnovski/mini.nvim/blob/main/readmes/mini-ai.md
    require('mini.ai').setup()

    -- Fast and feature-rich surround actions
    -- https://github.com/echasnovski/mini.nvim/blob/main/readmes/mini-surround.md
    require('mini.surround').setup({
      mappings = {
        add = 'sa',            -- Add surrounding in Normal and Visual modes
        delete = 'ds',         -- Delete surrounding
        find = 'sf',           -- Find surrounding (to the right)
        find_left = 'sF',      -- Find surrounding (to the left)
        highlight = 'sh',      -- Highlight surrounding
        replace = 'cs',        -- Replace surrounding
        update_n_lines = 'sn', -- Update `n_lines`

        suffix_last = 'l',     -- Suffix to search with "prev" method
        suffix_next = 'n',     -- Suffix to search with "next" method
      },
    })

    -- Go forward/backward with square brackets
    -- https://github.com/echasnovski/mini.nvim/blob/main/readmes/mini-bracketed.md
    require('mini.bracketed').setup({
      -- First-level elements are tables describing behavior of a target:
      --
      -- - <suffix> - single character suffix. Used after `[` / `]` in mappings.
      --   For example, with `b` creates `[B`, `[b`, `]b`, `]B` mappings.
      --   Supply empty string `''` to not create mappings.
      --
      -- - <options> - table overriding target options.
      --
      -- See `:h MiniBracketed.config` for more info.

      buffer     = { suffix = 'b', options = {} },
      comment    = { suffix = 'c', options = {} },
      conflict   = { suffix = 'x', options = {} },
      diagnostic = { suffix = 'd', options = {} },
      file       = { suffix = 'f', options = {} },
      indent     = { suffix = 'i', options = {} },
      jump       = { suffix = 'j', options = {} },
      location   = { suffix = 'l', options = {} },
      oldfile    = { suffix = 'o', options = {} },
      quickfix   = { suffix = 'q', options = {} },
      treesitter = { suffix = 't', options = {} },
      undo       = { suffix = 'u', options = {} },
      window     = { suffix = 'w', options = {} },
      yank       = { suffix = 'y', options = {} },
    })

    require('mini.pick').setup()
  end

}
