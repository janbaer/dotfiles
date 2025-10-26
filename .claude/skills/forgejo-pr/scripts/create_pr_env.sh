#!/usr/bin/env bash

# PR creation script using environment variables instead of gopass

title=${1}

if [ -z "$title" ]; then
  echo "Usage: $0 '<PR title>'"
  exit 1
fi

# Check for token in environment
if [ -z "$FORGEJO_TOKEN" ]; then
  echo "Error: FORGEJO_TOKEN environment variable not set"
  echo "Set it with: export FORGEJO_TOKEN='your-personal-access-token'"
  exit 1
fi

# Allow customization of Forgejo URL and owner
FORGEJO_URL="${FORGEJO_URL:-https://forgejo.home.janbaer.de}"
FORGEJO_OWNER="${FORGEJO_OWNER:-jan}"

current_branch=$(git branch --show-current)

if [ "$current_branch" = "main" ]; then
  echo "Error: Cannot create PR from main branch"
  exit 1
fi

# Check if PR description file exists, create default if missing
if [ ! -f "/tmp/PR_DESCRIPTION.md" ]; then
  echo "⚠️  PR description file not found at /tmp/PR_DESCRIPTION.md"
  echo "Creating default description..."
  cat > /tmp/PR_DESCRIPTION.md << EOF
## Description
Please provide a description of your changes.

## Changes
- 

## Testing
- 

## Related Issues
Closes #
EOF
  echo "Default description created. Please edit /tmp/PR_DESCRIPTION.md and run again."
  exit 1
fi

pr_body=$(cat /tmp/PR_DESCRIPTION.md)

# Get repository name from git remote URL
repo_name=$(git config --get remote.origin.url | sed -E 's/.*[:/]([^/]+)\/([^/.]+)(\.git)?$/\2/')

echo "📝 Creating PR for repository: $repo_name"
echo "🌿 Branch: $current_branch -> main"

# Escape JSON properly
json_body=$(jq -n \
  --arg title "$title" \
  --arg head "$current_branch" \
  --arg base "main" \
  --arg body "$pr_body" \
  '{title: $title, head: $head, base: $base, body: $body}')

# Create the PR
if curl -f -s -X POST "${FORGEJO_URL}/api/v1/repos/${FORGEJO_OWNER}/${repo_name}/pulls" \
  -H "Authorization: token $FORGEJO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$json_body" > /tmp/pr-response.json; then
  
  echo "✅ Pull request created successfully!"
  
  # Extract and display PR information
  pr_url=$(jq -r '.html_url' /tmp/pr-response.json)
  pr_number=$(jq -r '.number' /tmp/pr-response.json)
  
  echo "📌 PR #${pr_number}: ${title}"
  echo "🔗 URL: ${pr_url}"
  
  # Clean up description file after successful creation
  read -p "Remove PR description file? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm /tmp/PR_DESCRIPTION.md
    echo "Cleaned up /tmp/PR_DESCRIPTION.md"
  fi
  
  exit 0
else
  echo "❌ Failed to create pull request"
  echo "Response:"
  cat /tmp/pr-response.json 2>/dev/null || echo "No response received"
  
  # Check common issues
  if ! curl -s -H "Authorization: token $FORGEJO_TOKEN" "${FORGEJO_URL}/api/v1/user" > /dev/null 2>&1; then
    echo "⚠️  Authentication failed. Check your FORGEJO_TOKEN"
  fi
  
  exit 1
fi