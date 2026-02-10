---
name: configure-codex
description: Command to configure Codex CLI for each of my systems in the same way.
---

## Important

There is no `codex config` command. To check current settings (model, sandbox, approvals, etc.), read `~/.codex/config.toml` directly:
```bash
cat ~/.codex/config.toml
```

To modify these settings, edit the file directly. You can also override settings per-run with `codex -c key=value`.

## Model

Use model `gpt-5.3-codex` by default.

## Skills

Codex uses skills (folders under `~/.codex/skills`). Install skills that provide the same capabilities as the Claude plugins, if they exist in your curated list or repo.

If needed, use the `skill-installer` skill to install skills into `~/.codex/skills`.

## MCP-servers

Install the following MCP servers for the current user:

- **context7** (HTTP transport)
  ```bash
  codex mcp add context7 --url https://mcp.context7.com/mcp
  ```

- **fetch-mcp** (stdio, via uvx)
  ```bash
  codex mcp add fetch-mcp -- uvx mcp-server-fetch
  ```

- **structural-thinking-mcp** (stdio, via npx)
  ```bash
  codex mcp add structural-thinking-mcp -- npx -y @modelcontextprotocol/server-sequential-thinking
  ```

- **memory-mcp** (stdio, via npx)
  ```bash
  codex mcp add memory-mcp -- npx -y @modelcontextprotocol/server-memory
  ```

### Project-local MCP config for check24

Use a project-local Codex config in `~/Projects/check24/.codex/config.toml`:

```toml
[mcp_servers.jira]
command = "/Users/jan.baer/bin/jira-mcp-server"
env_vars = ["JIRA_API_TOKEN"]

[mcp_servers.jira.env]
JIRA_EMAIL = "jan.baer@check24.de"
JIRA_PROJECT = "VERBU"
JIRA_URL = "https://c24-vorsorge.atlassian.net"
```

Run Codex with `CODEX_HOME` pointing to that folder so the MCP server is available in `check24` and all subfolders:

```bash
CODEX_HOME=~/Projects/check24/.codex codex
```
