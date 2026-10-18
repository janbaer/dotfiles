---
name: forgejo-project-new
model: sonnet
description: Bootstrap a new software project — creates a local directory under ~/Projects/, initializes git, creates a private Forgejo repository, and scaffolds standard project files. Use this skill whenever the user wants to start a new project, create a new repo, bootstrap a codebase, or set up a new project from scratch. Trigger on phrases like "new project", "create a project called", "start a new project", "set up a new repo", or "forgejo-project-new".
disable-model-invocation: true
---

# New Project Setup

Walk the user through creating a new project interactively. Execute all steps yourself — don't just print instructions.

## Step 1: Collect inputs

Ask for these in order (wait for answers before proceeding):

1. **Project name** (required) — becomes both the local directory `~/Projects/<name>` and the Forgejo repo name. Use kebab-case.
2. **Description** (optional) — one-line description used for Forgejo and the README. Skip if empty.
3. **Technology** — show a numbered list and default to Bun/TypeScript:
   ```
   1. Bun/TypeScript (default)
   2. Go
   3. Rust
   4. Other
   ```

## Step 2: Create Forgejo repository

Use `mcp__forgejo-mcp__create_repo` with:
- `name`: the project name
- `private`: `true`
- `default_branch`: `main`
- `description`: description if provided (omit if empty)

Do NOT pass `owner` — the token's authenticated user is used automatically.

The resulting repo URL is: `https://forgejo.home.janbaer.de/jan/<name>`

**If repo creation fails with a token scope error:**
- Needs `write:repository` + `write:user` scopes: **Forgejo → Settings → Applications → Access Tokens**
- After updating the token, restart Claude Code so the MCP server reconnects with the new credentials
- The local setup (Step 3 onwards) can proceed independently while waiting — retry repo creation after restart

**If the repo already exists** (user is retrying after a previous partial run): skip this step and proceed.

## Step 3: Set up the local directory

```bash
mkdir -p ~/Projects/<name>
cd ~/Projects/<name>
git init
git checkout -b main
git remote add origin git@forgejo:jan/<name>.git
```

## Step 4: Create project files

Create all files in `~/Projects/<name>/`. Asset files are in the `assets/` directory next to this skill file — copy them as-is rather than re-typing their content.

### `.gitignore`

Copy from `assets/gitignore/<tech>` where `<tech>` is one of: `bun`, `go`, `rust`, `other`.

### `README.md`

```markdown
# <name>

<description — omit this line if no description was given>
```

### `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
```

### `.editorconfig`

Copy from `assets/.editorconfig`.

### `.mcp.json`

This file is in `.gitignore` — it contains local MCP server config and must not be committed.

```json
{
  "mcpServers": {
    "forgejo-mcp": {
      "type": "sse",
      "url": "https://forgejo.home.janbaer.de/sse"
    }
  }
}
```

### `.code-review.md`

Copy from `assets/.code-review.md`.

### `CLAUDE.md`

```markdown
# CLAUDE.md

## Project

**Name:** <name>
**Stack:** <technology>
<**Description:** description — omit if none>

Requirements: [`docs/requirements.md`](docs/requirements.md). Design decisions: [`docs/design.md`](docs/design.md).

## Development
```

### `docs/requirements.md`

```markdown
# Requirements

This document lists what the project must do, one requirement per line with a stable ID (R1, R2, ...) that `docs/design.md` refers to.
```

### `docs/design.md`

```markdown
# Design decisions

Decisions that are not obvious from the code. Each entry names the requirements it satisfies (`Satisfies: R1`) and the issue it came from.
```

## Step 5: Git hooks (optional)

Ask: **"Do you want to set up git hooks (e.g. lint on commit, build+test on push)?"**

If no → skip to Step 6.

If yes, ask what commands to run for `pre-commit` and `pre-push`. Use sensible defaults based on the tech stack (e.g. lint on pre-commit, build+test on pre-push).

### Bun/TypeScript

Use `simple-git-hooks` — hooks are declared in `package.json` and installed automatically via `postinstall`.

**Install the package:**
```bash
cd ~/Projects/<name> && bun add -d simple-git-hooks
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "postinstall": "bunx simple-git-hooks"
  },
  "simple-git-hooks": {
    "pre-commit": "bun run lint",
    "pre-push": "bun run build && bun test"
  }
}
```

Adjust the commands to match the project's actual scripts. Then activate:
```bash
cd ~/Projects/<name> && bunx simple-git-hooks
```

### Go / Rust / Other

Use a `.githooks/` directory committed to the repo, then point git at it.

```bash
mkdir -p ~/Projects/<name>/.githooks
```

Copy `assets/hooks/pre-commit` and `assets/hooks/pre-push` into `.githooks/`, fill in the actual commands, then make them executable:
```bash
chmod +x ~/Projects/<name>/.githooks/pre-commit ~/Projects/<name>/.githooks/pre-push
git -C ~/Projects/<name> config core.hooksPath .githooks
```

## Step 6: Requirements and design interview (optional)

Ask: **"Run the project interview now to fill requirements.md and design.md?"**

- No → skip to Step 7. The two documents stay as created above and can be filled later with `forgejo-project-interview`.
- Yes → invoke the **forgejo-project-interview** skill in `init` mode. It interviews Jan with `grill-me` and writes both files.

## Step 7: Initial commit and push

```bash
cd ~/Projects/<name>
git add .
git commit -m "Initial commit"
git push -u origin main
```

Note: `.mcp.json` is gitignored and will not be included.

The documents from Step 6 (`docs/requirements.md`, `docs/design.md`) are part of this commit.

## Step 8: Open in editor

```bash
cd ~/Projects/<name> && nvim .
```

## Summary

After completion, tell the user:
- Local path: `~/Projects/<name>`
- Forgejo repo: `https://forgejo.home.janbaer.de/jan/<name>`
- Tech stack and whether the project interview ran
- Files created
