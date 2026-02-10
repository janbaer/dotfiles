---
name: configure-claude
description: Command to configure Claude code for each of my systems in the same way.
---

## Important

There is no `claude config` command. To check current settings (model, statusline, permissions, etc.), read `~/.claude/settings.json` directly:
```bash
cat ~/.claude/settings.json | jq .
```
To modify these settings, edit the file directly with the Edit tool.
Note: CLI commands for `claude plugin`, `claude mcp`, etc. do exist and should be used for those operations.

## Model

Use model `sonnet` by default

## Marketplaces

Add the following plugin marketplaces:

- **claude-code-plugins** (GitHub: anthropics/claude-code)
  ```bash
  claude plugin marketplace add anthropics/claude-code
  ```

- **superpowers-dev** (GitHub: obra/superpowers)
  ```bash
  claude plugin marketplace add obra/superpowers
  ```

## Plugins

Install the following plugins (scope: `user`):

- **frontend-design**
  ```bash
  claude plugin install -s user frontend-design
  ```

- **code-review**
  ```bash
  claude plugin install -s user code-review
  ```

- **pr-review-toolkit**
  ```bash
  claude plugin install -s user pr-review-toolkit
  ```

- **superpowers**
  ```bash
  claude plugin install -s user superpowers
  ```

## MCP-servers

Install the following MCP servers for the current user (scope: `user`):

- **context7** (HTTP transport)
  ```bash
  claude mcp add -s user -t http context7 https://mcp.context7.com/mcp
  ```

- **fetch-mcp** (stdio, via uvx)
  ```bash
  claude mcp add -s user fetch-mcp -- uvx mcp-server-fetch
  ```

- **structural-thinking-mcp** (stdio, via npx)
  ```bash
  claude mcp add -s user structural-thinking-mcp -- npx -y @modelcontextprotocol/server-sequential-thinking
  ```

- **memory-mcp** (stdio, via npx)
  ```bash
  claude mcp add -s user memory-mcp -- npx -y @modelcontextprotocol/server-memory
  ```

## Statusline

- Use for the statusline the script @~/.claude/statusline-command.sh
