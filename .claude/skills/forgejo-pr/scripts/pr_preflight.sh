#!/bin/bash

# Forgejo PR Pre-flight Check Script
# Validates branch readiness before PR creation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Forgejo PR Pre-flight Checks"
echo "================================"

# Configuration (can be overridden by environment variables)
BASE_BRANCH=${BASE_BRANCH:-main}
BRANCH_PREFIX_PATTERN=${BRANCH_PREFIX_PATTERN:-"^(feature|fix|hotfix|docs|chore|refactor)/.*"}
COMMIT_PATTERN=${COMMIT_PATTERN:-"^(feat|fix|docs|style|refactor|perf|test|chore|build|ci):.*"}
MIN_TEST_COVERAGE=${MIN_TEST_COVERAGE:-80}

# Check function
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check current branch
echo -n "Checking current branch... "
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    check_fail "Not on a branch"
fi

if [ "$CURRENT_BRANCH" == "$BASE_BRANCH" ]; then
    check_fail "Cannot create PR from base branch ($BASE_BRANCH)"
fi
check_pass "On branch: $CURRENT_BRANCH"

# 2. Check branch naming convention
echo -n "Checking branch naming convention... "
if [[ ! "$CURRENT_BRANCH" =~ $BRANCH_PREFIX_PATTERN ]]; then
    check_fail "Branch name doesn't match pattern: $BRANCH_PREFIX_PATTERN"
fi
check_pass "Branch name follows convention"

# 3. Check for uncommitted changes
echo -n "Checking for uncommitted changes... "
if [ -n "$(git status --porcelain)" ]; then
    check_fail "Uncommitted changes detected. Please commit or stash them."
fi
check_pass "Working directory clean"

# 4. Check if branch is up to date with remote
echo -n "Checking if branch is pushed... "
git fetch origin "$CURRENT_BRANCH" 2>/dev/null || true
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse "origin/$CURRENT_BRANCH" 2>/dev/null || echo "")

if [ -z "$REMOTE_COMMIT" ]; then
    check_warn "Branch not pushed to remote yet"
elif [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    LOCAL_AHEAD=$(git rev-list --count "origin/$CURRENT_BRANCH..HEAD" 2>/dev/null || echo "0")
    LOCAL_BEHIND=$(git rev-list --count "HEAD..origin/$CURRENT_BRANCH" 2>/dev/null || echo "0")
    
    if [ "$LOCAL_AHEAD" -gt 0 ]; then
        check_warn "Local branch is $LOCAL_AHEAD commits ahead of remote"
    fi
    
    if [ "$LOCAL_BEHIND" -gt 0 ]; then
        check_fail "Local branch is $LOCAL_BEHIND commits behind remote. Please pull first."
    fi
else
    check_pass "Branch is up to date with remote"
fi

# 5. Check if up to date with base branch
echo -n "Checking if up to date with $BASE_BRANCH... "
git fetch origin "$BASE_BRANCH" 2>/dev/null || true
MERGE_BASE=$(git merge-base HEAD "origin/$BASE_BRANCH")
BASE_COMMIT=$(git rev-parse "origin/$BASE_BRANCH")

if [ "$MERGE_BASE" != "$BASE_COMMIT" ]; then
    BEHIND_COUNT=$(git rev-list --count "$MERGE_BASE..origin/$BASE_BRANCH")
    check_warn "Branch is $BEHIND_COUNT commits behind $BASE_BRANCH. Consider rebasing."
else
    check_pass "Up to date with $BASE_BRANCH"
fi

# 6. Check commit messages
echo -n "Checking commit messages... "
COMMITS=$(git log --format="%s" "origin/$BASE_BRANCH..HEAD" 2>/dev/null || git log --format="%s" -10)
BAD_COMMITS=0

while IFS= read -r commit; do
    if [[ ! "$commit" =~ $COMMIT_PATTERN ]]; then
        if [ $BAD_COMMITS -eq 0 ]; then
            echo ""
        fi
        echo -e "  ${RED}Bad commit:${NC} $commit"
        BAD_COMMITS=$((BAD_COMMITS + 1))
    fi
done <<< "$COMMITS"

if [ $BAD_COMMITS -gt 0 ]; then
    check_fail "Found $BAD_COMMITS commits not following conventional format"
fi
check_pass "All commits follow conventional format"

# 7. Check for merge conflicts
echo -n "Checking for potential merge conflicts... "
git merge-tree $(git merge-base HEAD "origin/$BASE_BRANCH") HEAD "origin/$BASE_BRANCH" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    check_warn "Potential merge conflicts detected"
else
    check_pass "No merge conflicts detected"
fi

# 8. Run tests if available
if [ -f "Makefile" ] && grep -q "^test:" Makefile; then
    echo -n "Running tests... "
    if make test > /dev/null 2>&1; then
        check_pass "Tests passed"
    else
        check_fail "Tests failed"
    fi
elif [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo -n "Running tests... "
    if npm test > /dev/null 2>&1; then
        check_pass "Tests passed"
    else
        check_fail "Tests failed"
    fi
else
    check_warn "No test suite found"
fi

# 9. Check for large files
echo -n "Checking for large files... "
LARGE_FILES=$(find . -type f -size +10M -not -path "./.git/*" 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo ""
    echo "$LARGE_FILES" | while read -r file; do
        SIZE=$(du -h "$file" | cut -f1)
        echo -e "  ${YELLOW}Large file:${NC} $file ($SIZE)"
    done
    check_warn "Found large files (>10MB)"
else
    check_pass "No large files found"
fi

# 10. Check for sensitive data patterns
echo -n "Checking for sensitive data... "
SENSITIVE_PATTERNS="(password|secret|token|api[_-]?key|private[_-]?key).*=.*['\"].*['\"]"
SENSITIVE_FILES=$(git diff "origin/$BASE_BRANCH"...HEAD --name-only | xargs grep -l -E -i "$SENSITIVE_PATTERNS" 2>/dev/null || true)

if [ -n "$SENSITIVE_FILES" ]; then
    echo ""
    echo "$SENSITIVE_FILES" | while read -r file; do
        echo -e "  ${YELLOW}Potential sensitive data in:${NC} $file"
    done
    check_warn "Potential sensitive data found. Please review."
else
    check_pass "No obvious sensitive data patterns found"
fi

echo ""
echo "================================"
echo -e "${GREEN}✓ Pre-flight checks complete!${NC}"
echo ""
echo "Ready to create PR:"
echo "  Branch: $CURRENT_BRANCH -> $BASE_BRANCH"
echo ""
echo "Create PR with:"
echo "  tea pr create --base $BASE_BRANCH --head $CURRENT_BRANCH"