---
name: configure-claude
description: Configure Claude Code installation with Jan's standard setup — model, MCP servers, plugins, marketplaces, and statusline. Use when setting up Claude on a new machine, syncing configuration across systems, or when the user says "configure claude", "set up claude", "install my plugins", "add my MCP servers", or "sync my claude config". Also trigger when the user mentions missing MCP servers, plugins, or wants to verify their Claude setup matches the standard.
---

# Configure Claude Code

This skill configures a Claude Code installation to match Jan's standard setup. It checks what's already configured and only applies what's missing, making it safe to run repeatedly.

## Workflow

### Step 1: Read current state

Read `~/.claude/settings.json` to understand what's already configured. Note:
- Current model setting
- Existing MCP servers (check `mcpServers` key)
- Existing marketplaces (check `extraKnownMarketplaces` key)
- Enabled plugins (check `enabledPlugins` key)
- Statusline configuration

### Step 2: Apply settings.json changes

Edit `~/.claude/settings.json` directly for these settings (only if they differ from desired):

**Model:** `opus`

**Statusline:**
```json
"statusLine": {
  "type": "command",
  "command": "~/.claude/statusline-command.sh"
}
```

**Marketplaces** (merge into `extraKnownMarketplaces`):
```json
"extraKnownMarketplaces": {
  "claude-plugins-official": { "source": { "source": "github", "repo": "anthropics/claude-code" } },
  "superpowers-marketplace": { "source": { "source": "github", "repo": "obra/superpowers" } },
  "thedotmack": { "source": { "source": "github", "repo": "thedotmack/claude-mem" } }
}
```

Preserve any existing marketplaces not in this list (like `context-mode`).

### Step 3: Add MCP servers

For each MCP server below, check if it already exists in `claude mcp list` output. Only add missing ones.

Run via Bash tool:

- **context7** (HTTP)
  ```bash
  claude mcp add -s user -t http context7 https://mcp.context7.com/mcp
  ```

- **howcani-mcp** (HTTP with auth)
  Requires `HOWCANI_TOKEN` env var in shell profile.
  ```bash
  claude mcp add-json -s user howcani-mcp '{"type":"http","url":"https://howcani.home.janbaer.de/mcp","headers":{"Authorization":"Bearer ${HOWCANI_TOKEN}"}}'
  ```

### Step 4: Install plugins

For each plugin below, check if it already appears in `enabledPlugins` in settings.json. Only install missing ones.

Run via Bash tool:

- **frontend-design**
  ```bash
  claude plugin install -s user frontend-design
  ```

- **code-mem**
  ```bash
  claude plugin install -s user code-mem
  ```

- **context-mode**
  ```bash
  claude plugin install -s user context-mode
  ```

- **typescript-lsp**
  ```bash
  claude plugin install -s user typescript-lsp
  ```

### Step 5: Report results

Summarize what was done in a table:

| Component | Status |
|-----------|--------|
| Model     | set to sonnet / already sonnet |
| Statusline | configured / already configured |
| Marketplaces | added N / all present |
| MCP servers | added N / all present |
| Plugins | installed N / all present |

If any MCP server or plugin command failed, report the error and suggest the user run it manually after exiting Claude with `! <command>`.
