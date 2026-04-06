---
name: forgejo-project-new
description: Bootstrap a new software project — creates a local directory under ~/Projects/, initializes git, creates a private Forgejo repository, and scaffolds standard project files. Use this skill whenever the user wants to start a new project, create a new repo, bootstrap a codebase, or set up a new project from scratch. Trigger on phrases like "new project", "create a project called", "start a new project", "set up a new repo", or "forgejo-project-new".
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

### `CLAUDE.md` (without OpenSpec)

Used when the user opts out of OpenSpec. Contains all project context directly.

```markdown
# CLAUDE.md

## Project

**Name:** <name>
**Stack:** <technology>
<**Description:** description — omit if none>

## Development
```

### `CLAUDE.md` (with OpenSpec)

Used when OpenSpec is enabled. Thin operational file — all project context lives in `openspec/project.md`.

```markdown
# CLAUDE.md

For project purpose, tech stack, architecture, conventions, and domain context see [`openspec/project.md`](openspec/project.md).

## Development
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

## Step 6: OpenSpec setup (optional)

Ask: **"Should this project use OpenSpec for spec-driven development?"**

### If no → skip to Step 7.

### If yes:

**6a. Initialize OpenSpec:**
```bash
cd ~/Projects/<name> && openspec init --tools claude --force
```

**6b. Interview the user about the project:**

Use the `/grill-me` skill with this prompt:
> "I'm setting up a new project called `<name>` using `<technology>`. Please interview me about the project so we can document it in `openspec/project.md`. Cover: purpose and goals, tech stack details (frameworks, libraries, database), architecture patterns, code conventions, testing strategy, domain concepts and entities, and any important constraints. The result should be written to `./openspec/project.md`."

**6c. Write the interview result to `openspec/project.md`:**

Use the howcani `openspec/project.md` as a structural reference. Include these sections as applicable:
- `## Purpose`
- `## Tech Stack`
- `## Project Conventions` (code style, naming, error handling)
- `## Architecture Patterns`
- `## Testing Strategy`
- `## Domain Context` (core entities, key concepts)
- `## Important Constraints`

**6d. Replace `CLAUDE.md`** with the "with OpenSpec" variant from above.

**6e. Commit the OpenSpec files separately** after the initial commit:
```bash
cd ~/Projects/<name>
git add openspec/ CLAUDE.md
git commit -m "docs ✨: Adding OpenSpec project context"
git push
```

## Step 7: Initial commit and push

```bash
cd ~/Projects/<name>
git add .
git commit -m "Initial commit"
git push -u origin main
```

Note: `.mcp.json` is gitignored and will not be included.

## Step 8: Open in editor

```bash
cd ~/Projects/<name> && nvim .
```

## Summary

After completion, tell the user:
- Local path: `~/Projects/<name>`
- Forgejo repo: `https://forgejo.home.janbaer.de/jan/<name>`
- Tech stack and whether OpenSpec was initialized
- Files created
