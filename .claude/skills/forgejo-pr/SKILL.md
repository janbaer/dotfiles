---
name: forgejo-pr
description: Toolkit for creating and managing Pull Requests on Forgejo Git repository servers using Bash scripts and API. Supports PR creation with templates, validation checks, and automated workflows. Use this when working with Forgejo PRs, merge requests, or repository collaboration.
---

# Forgejo Pull Request Management

Practical skill for creating and managing Pull Requests on Forgejo Git repository servers using Bash scripts and the REST API.

## Quick Start

### Basic PR Creation

```bash
# Using the main script (requires gopass for token management)
scripts/create_pr.sh "feat: Add new feature"

# Using environment variable for token
FORGEJO_TOKEN="your-token" scripts/create_pr_env.sh "fix: Critical bug"

# With custom description file
echo "## Description\nDetailed PR description" > /tmp/PR_DESCRIPTION.md
scripts/create_pr.sh "feat: New feature"
```

### PR Creation Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes and commit**: Using conventional commits
3. **Write PR description**: Save to `/tmp/PR_DESCRIPTION.md`
4. **Create PR**: `scripts/create_pr.sh "Your PR title"`

## Core Scripts

### Main PR Creation (`scripts/create_pr.sh`)
The primary script for creating PRs. Features:
- Automatic token retrieval from gopass
- PR description from `/tmp/PR_DESCRIPTION.md`
- Repository detection from git remote
- JSON escaping with jq
- Success/failure feedback

### Environment-based PR Creation (`scripts/create_pr_env.sh`)
Alternative script using environment variables:
- Token from `FORGEJO_TOKEN` env variable
- Configurable Forgejo instance URL
- Same PR description workflow

### PR Validation (`scripts/pr_preflight.sh`)
Pre-flight checks before creating PR:
- Branch naming conventions
- Commit message format
- Uncommitted changes check
- Remote synchronization status
- Merge conflict detection

## Configuration

### Token Management

```bash
# Using gopass (recommended)
gopass insert home/forgejo/username

# Using environment variable
export FORGEJO_TOKEN="your-personal-access-token"

# Using .env file
echo "FORGEJO_TOKEN=your-token" >> .env
source .env
```

### Forgejo Instance Setup

```bash
# Set your Forgejo instance URL
export FORGEJO_URL="https://forgejo.home.janbaer.de"

# Or configure in the script
FORGEJO_URL="${FORGEJO_URL:-https://forgejo.home.janbaer.de}"
```

## PR Description Templates

### Using Templates

```bash
# Generate PR description from template
scripts/generate_pr_description.sh feature > /tmp/PR_DESCRIPTION.md

# Or use pre-made templates
cp references/templates/feature.md /tmp/PR_DESCRIPTION.md
# Edit as needed, then create PR
scripts/create_pr.sh "feat: Your feature"
```

### Available Templates

Create these templates in `references/templates/`:
- `feature.md` - New features
- `bugfix.md` - Bug fixes
- `hotfix.md` - Critical fixes
- `docs.md` - Documentation updates

## Advanced Usage

### Batch PR Creation

```bash
# Create PRs for multiple branches
scripts/batch_create_pr.sh \
  --branches "feature/auth,feature/ui,feature/api" \
  --base main
```

### PR with Metadata

```bash
# Create PR with labels and assignees
scripts/create_pr_advanced.sh \
  --title "feat: New feature" \
  --labels "enhancement,needs-review" \
  --assignees "reviewer1,reviewer2" \
  --milestone 3
```

### PR Status Check

```bash
# Check PR status
scripts/check_pr_status.sh PR_NUMBER

# List open PRs
scripts/list_prs.sh --state open

# Check merge conflicts
scripts/check_conflicts.sh PR_NUMBER
```

## API Operations

### Direct API Calls

```bash
# Get PR details
curl -H "Authorization: token $FORGEJO_TOKEN" \
  "$FORGEJO_URL/api/v1/repos/jan/repo/pulls/42"

# Merge PR
curl -X POST \
  -H "Authorization: token $FORGEJO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"Do": "squash"}' \
  "$FORGEJO_URL/api/v1/repos/jan/repo/pulls/42/merge"
```

### Using jq for Response Processing

```bash
# Extract PR URL from response
jq -r '.html_url' /tmp/pr-response.json

# Get PR number
jq -r '.number' /tmp/pr-response.json

# Check mergeable status
jq -r '.mergeable' /tmp/pr-response.json
```

## Troubleshooting

### Common Issues

1. **Token authentication fails**
   ```bash
   # Verify token
   curl -H "Authorization: token $FORGEJO_TOKEN" \
     "$FORGEJO_URL/api/v1/user"
   ```

2. **PR description file missing**
   ```bash
   # Create default template
   echo "## Description\n\nPR description here" > /tmp/PR_DESCRIPTION.md
   ```

3. **Wrong repository detected**
   ```bash
   # Check git remote
   git config --get remote.origin.url
   
   # Set correct remote
   git remote set-url origin https://forgejo.home.janbaer.de/jan/repo.git
   ```

4. **JSON escaping issues**
   ```bash
   # Always use jq for JSON generation
   jq -n --arg body "$pr_body" '{body: $body}'
   ```

## Workflow Integration

### Git Hooks

Create `.git/hooks/prepare-commit-msg`:
```bash
#!/bin/bash
# Auto-generate PR description template
if [ ! -f /tmp/PR_DESCRIPTION.md ]; then
  branch=$(git branch --show-current)
  echo "## ${branch}\n\n### Changes\n- \n\n### Testing\n- " > /tmp/PR_DESCRIPTION.md
fi
```

### Aliases

Add to your shell configuration:
```bash
# Quick PR creation
alias pr-create='scripts/create_pr.sh'
alias pr-check='scripts/pr_preflight.sh'
alias pr-list='scripts/list_prs.sh'

# PR description management
alias pr-desc='vim /tmp/PR_DESCRIPTION.md'
alias pr-template='scripts/generate_pr_description.sh'
```

### Makefile Integration

```makefile
# In your project Makefile
pr-check:
	@scripts/pr_preflight.sh

pr-create:
	@read -p "PR Title: " title; \
	scripts/create_pr.sh "$$title"

pr: pr-check pr-create
```

## Security Best Practices

- Never commit tokens to repository
- Use gopass or secret managers for token storage
- Set appropriate token scopes (minimum required)
- Rotate tokens regularly
- Use separate tokens for CI/CD

## Tips and Tricks

1. **Quick PR description**: Keep common templates ready
2. **Branch naming**: Follow pattern for auto-detection
3. **Commit messages**: Use conventional commits
4. **PR validation**: Always run preflight checks
5. **Response handling**: Save API responses for debugging
