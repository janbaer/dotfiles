#!/usr/bin/env bash

claude mcp add -s user context7 -- npx -y @upstash/context7-mcp
claude mcp add-json --scope=user memory-mcp '{
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {
        "MEMORY_FILE_PATH": "/home/jan/.claude/memory.json"
      }
    }'
claude mcp add-json --scope=user sequential-thinking-mcp '{
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sequential-thinking"
      ]
    }'
claude mcp add-json --scope=user fetch-mcp '{
      "command": "uvx",
      "args": [
        "mcp-server-fetch"
      ]
    }'
