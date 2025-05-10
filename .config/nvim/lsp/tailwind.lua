---@type vim.lsp.Config
return {
    cmd = { "tailwindcss-language-server", "--stdio" },
    root_markers = { "tailwind.config.js" },
    filetypes = { "javascript", "htmldjango", "css" },
    settings = {
        tailwindCSS = {
            validate = true,
            lint = {
                cssConflict = "warning",
                invalidApply = "error",
                invalidScreen = "error",
                invalidVariant = "error",
                invalidConfigPath = "error",
                invalidTailwindDirective = "error",
                recommendedVariantOrder = "warning",
            },
            classAttributes = {
                "class",
                "className",
                "class:list",
                "classList",
                "ngClass",
            },
            includeLanguages = {
                eelixir = "html-eex",
                eruby = "erb",
                templ = "html",
                htmlangular = "html",
                htmldjango = "html",
            },
        },
    },
}
