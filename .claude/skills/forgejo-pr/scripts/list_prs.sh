#!/usr/bin/env bash

# List pull requests for the current repository

# Get configuration from environment or use defaults
FORGEJO_URL="${FORGEJO_URL:-https://forgejo.home.janbaer.de}"
FORGEJO_OWNER="${FORGEJO_OWNER:-jan}"

# Get token from gopass or environment
if [ -n "$FORGEJO_TOKEN" ]; then
  forgejo_token="$FORGEJO_TOKEN"
else
  forgejo_token=$(gopass show home/forgejo/jan 2>/dev/null)
  if [ -z "$forgejo_token" ]; then
    echo "Error: No token found. Set FORGEJO_TOKEN or configure gopass"
    exit 1
  fi
fi

# Parse arguments
STATE="open"
while [[ $# -gt 0 ]]; do
  case $1 in
    --state)
      STATE="$2"
      shift 2
      ;;
    --all)
      STATE="all"
      shift
      ;;
    --closed)
      STATE="closed"
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  --state <open|closed|all>  Filter by PR state (default: open)"
      echo "  --all                       Show all PRs"
      echo "  --closed                    Show only closed PRs"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Get repository name from git remote URL
repo_name=$(git config --get remote.origin.url | sed -E 's/.*[:/]([^/]+)\/([^/.]+)(\.git)?$/\2/')

if [ -z "$repo_name" ]; then
  echo "Error: Could not determine repository name from git remote"
  exit 1
fi

echo "📋 Fetching pull requests for $FORGEJO_OWNER/$repo_name (state: $STATE)"
echo "─────────────────────────────────────────────────"

# Fetch PRs from API
response=$(curl -s -H "Authorization: token $forgejo_token" \
  "${FORGEJO_URL}/api/v1/repos/${FORGEJO_OWNER}/${repo_name}/pulls?state=${STATE}&limit=50")

# Check if response is valid JSON
if ! echo "$response" | jq empty 2>/dev/null; then
  echo "Error: Failed to fetch PRs or invalid response"
  echo "$response"
  exit 1
fi

# Count PRs
pr_count=$(echo "$response" | jq length)

if [ "$pr_count" -eq 0 ]; then
  echo "No ${STATE} pull requests found"
  exit 0
fi

echo "Found $pr_count pull request(s)"
echo ""

# Display PRs in a formatted way
echo "$response" | jq -r '.[] | 
  "PR #\(.number): \(.title)",
  "  Author: \(.user.login)",
  "  Branch: \(.head.ref) → \(.base.ref)",
  "  Created: \(.created_at | split("T")[0])",
  (if .draft then "  Status: 📝 Draft" else "  Status: ✅ Ready" end),
  (if .merged then "  Merged: ✓" elif .state == "closed" then "  Closed: ✗" else "" end),
  "  URL: \(.html_url)",
  "─────────────────────────────────────────────────"'

# Summary statistics
if [ "$STATE" = "all" ]; then
  open_count=$(echo "$response" | jq '[.[] | select(.state == "open")] | length')
  closed_count=$(echo "$response" | jq '[.[] | select(.state == "closed")] | length')
  merged_count=$(echo "$response" | jq '[.[] | select(.merged == true)] | length')
  
  echo ""
  echo "📊 Summary:"
  echo "  Open: $open_count"
  echo "  Closed: $closed_count" 
  echo "  Merged: $merged_count"
fi