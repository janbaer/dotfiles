---
name: forgejo-project-update
description: Audit an existing project against Jan's standard project configuration and apply missing items. Use this skill when the user wants to update an existing project's config, sync project standards, or notices something missing like .editorconfig, .code-review.md, git hooks, CLAUDE.md, or CHANGELOG.md. Trigger on phrases like "update project config", "sync project standards", "add code review guidelines to my project", "bring this project up to standard", or "what config is missing from this project".
---

# Project Config Audit & Update

This skill audits an existing project against the standard defined in `forgejo-project-new` and applies whatever is missing.

**Before starting:** Read `../forgejo-project-new/SKILL.md` (relative to this skill file) to understand the full standard — the checklist of files, tools, and config a complete project should have. That skill is the single source of truth; don't rely on memory.

## Step 1: Detect tech stack

Infer from files present in the project root:
- `package.json` or `bun.lock` → **Bun/TypeScript**
- `go.mod` → **Go**
- `Cargo.toml` → **Rust**
- None of the above → **Other**

## Step 2: Audit the project

Check each standard item. Use filesystem checks (not git) since some files like `.mcp.json` are gitignored.

| Item | How to check |
|------|-------------|
| `.gitignore` | Exists? Contains `.mcp.json` entry? |
| `.editorconfig` | Exists? |
| `.code-review.md` | Exists? |
| `CHANGELOG.md` | Exists? |
| `.mcp.json` | Exists on disk? |
| `CLAUDE.md` | Exists? |
| Git hooks | Bun: `simple-git-hooks` key in `package.json` + `postinstall` script. Others: `.githooks/` dir exists + `git config core.hooksPath` set |
| OpenSpec | `openspec/` directory exists? |

## Step 3: Report findings

Show a clear checklist before doing anything:

```
Project: <name>  Stack: <tech>

✅ .gitignore
❌ .editorconfig
❌ .code-review.md
✅ CHANGELOG.md
✅ .mcp.json
✅ CLAUDE.md
❌ git hooks
⚠️  OpenSpec (optional — ask separately)
```

Use ⚠️ for optional items (OpenSpec, git hooks) that the user may intentionally skip.

## Step 4: Ask what to apply

Ask: **"Which of these would you like me to add? Type 'all', list specific ones, or 'none' to cancel."**

For OpenSpec specifically, ask separately since it requires an interview — don't bundle it with the others.

## Step 5: Apply selected items

For each selected item, copy the appropriate template from `../forgejo-project-new/assets/` — never retype content that already exists there.

- `.editorconfig` → copy from `assets/.editorconfig`
- `.code-review.md` → copy from `assets/.code-review.md`
- `.gitignore` → copy from `assets/gitignore/<tech>` (never overwrite an existing file — merge missing entries instead)
- `.mcp.json` → write the standard MCP config (see `forgejo-project-new` SKILL.md for content)
- `CHANGELOG.md` → write the standard changelog header (see `forgejo-project-new` SKILL.md for content)
- `CLAUDE.md` → write the standard CLAUDE.md for the chosen variant (with or without OpenSpec)
- **Git hooks (Bun/TS)**: add `simple-git-hooks` dependency + `postinstall` + hook config to `package.json`, then run `bunx simple-git-hooks`
- **Git hooks (Go/Rust/Other)**: copy `assets/hooks/pre-commit` and `assets/hooks/pre-push` to `.githooks/`, make executable, run `git config core.hooksPath .githooks` — then ask the user what commands to put in each hook
- **OpenSpec**: follow the OpenSpec setup steps from `forgejo-project-new` (init + grill-me interview + write `openspec/project.md`)

Never overwrite a file that already exists without asking first.

## Step 6: Commit

After applying changes, offer to commit with:
```
git add <changed files>
git commit -m "claude 🔧: Syncing project config to standard"
```
