#!/usr/bin/env bash

# Generate PR description from templates

TEMPLATE_TYPE="${1:-feature}"
OUTPUT_FILE="${2:-/tmp/PR_DESCRIPTION.md}"

# Function to create feature template
create_feature_template() {
  cat << 'EOF'
## Description
Brief description of the feature being added.

## Motivation and Context
Why is this change required? What problem does it solve?

## Changes Made
- 
- 
- 

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passed
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated if needed
- [ ] No commented out code
- [ ] No debug print statements

## Related Issues
Closes #

## Screenshots (if applicable)
EOF
}

# Function to create bugfix template
create_bugfix_template() {
  cat << 'EOF'
## Description
Brief description of the bug being fixed.

## Root Cause
What caused the bug?

## Solution
How does this fix address the root cause?

## Testing
- [ ] Bug reproduction steps verified
- [ ] Fix tested locally
- [ ] Regression tests passed
- [ ] Edge cases considered

## Checklist
- [ ] Fix is minimal and focused
- [ ] No unrelated changes included
- [ ] Tests added to prevent regression
- [ ] Existing tests still pass

## Related Issues
Fixes #

## Test Evidence
```
# Add test output or screenshots here
```
EOF
}

# Function to create hotfix template
create_hotfix_template() {
  cat << 'EOF'
## 🔥 Hotfix

**Severity**: HIGH / MEDIUM / LOW
**Environment**: Production / Staging

## Issue Description
Brief description of the critical issue.

## Impact
- Who is affected:
- What functionality is broken:
- Since when:

## Root Cause
Identified root cause of the issue.

## Fix Applied
Description of the fix.

## Testing
- [ ] Fix tested in local environment
- [ ] Fix tested in staging (if possible)
- [ ] Smoke tests passed
- [ ] No side effects identified

## Rollback Plan
If this fix causes issues:
1. 
2. 

## Related Issues
Fixes #

## Post-Incident Actions
- [ ] Post-mortem scheduled
- [ ] Monitoring added
- [ ] Documentation updated
EOF
}

# Function to create docs template
create_docs_template() {
  cat << 'EOF'
## Description
Summary of documentation changes.

## Type of Documentation
- [ ] README updates
- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
- [ ] Configuration guide
- [ ] Code comments

## Changes Made
- 
- 

## Checklist
- [ ] Spelling and grammar checked
- [ ] Links tested and working
- [ ] Code examples tested
- [ ] Format consistent with existing docs
- [ ] Table of contents updated (if applicable)

## Related Issues
Closes #
EOF
}

# Function to create refactor template
create_refactor_template() {
  cat << 'EOF'
## Description
Brief description of the refactoring.

## Motivation
Why is this refactoring needed?

## Changes Made
- 
- 
- 

## Impact Analysis
- [ ] No breaking changes
- [ ] API compatibility maintained
- [ ] Performance impact assessed
- [ ] Memory usage checked

## Testing
- [ ] All existing tests pass
- [ ] New tests added where needed
- [ ] Integration tests verified
- [ ] Manual testing completed

## Checklist
- [ ] Code is cleaner and more maintainable
- [ ] No functionality changes (unless intended)
- [ ] Dead code removed
- [ ] Comments updated

## Related Issues
Relates to #
EOF
}

# Function to create custom template from branch name
create_from_branch() {
  current_branch=$(git branch --show-current)
  
  # Extract info from branch name
  if [[ $current_branch =~ ^(feature|fix|hotfix|docs|refactor)/(.+)$ ]]; then
    branch_type="${BASH_REMATCH[1]}"
    branch_desc="${BASH_REMATCH[2]}"
    
    # Convert branch description to readable format
    readable_desc=$(echo "$branch_desc" | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')
    
    case $branch_type in
      feature)
        create_feature_template | sed "s/Brief description of the feature being added./${readable_desc}/"
        ;;
      fix)
        create_bugfix_template | sed "s/Brief description of the bug being fixed./${readable_desc}/"
        ;;
      hotfix)
        create_hotfix_template | sed "s/Brief description of the critical issue./${readable_desc}/"
        ;;
      docs)
        create_docs_template | sed "s/Summary of documentation changes./${readable_desc}/"
        ;;
      refactor)
        create_refactor_template | sed "s/Brief description of the refactoring./${readable_desc}/"
        ;;
    esac
  else
    # Default to feature template
    create_feature_template
  fi
}

# Main script logic
case "$TEMPLATE_TYPE" in
  feature)
    create_feature_template > "$OUTPUT_FILE"
    ;;
  bugfix|bug|fix)
    create_bugfix_template > "$OUTPUT_FILE"
    ;;
  hotfix)
    create_hotfix_template > "$OUTPUT_FILE"
    ;;
  docs|doc|documentation)
    create_docs_template > "$OUTPUT_FILE"
    ;;
  refactor)
    create_refactor_template > "$OUTPUT_FILE"
    ;;
  auto)
    create_from_branch > "$OUTPUT_FILE"
    ;;
  --help)
    echo "Usage: $0 [TEMPLATE_TYPE] [OUTPUT_FILE]"
    echo ""
    echo "TEMPLATE_TYPE options:"
    echo "  feature    - New feature template (default)"
    echo "  bugfix     - Bug fix template"
    echo "  hotfix     - Critical hotfix template"
    echo "  docs       - Documentation template"
    echo "  refactor   - Code refactoring template"
    echo "  auto       - Auto-detect from branch name"
    echo ""
    echo "OUTPUT_FILE: Path to output file (default: /tmp/PR_DESCRIPTION.md)"
    echo ""
    echo "Examples:"
    echo "  $0                    # Create feature template"
    echo "  $0 bugfix            # Create bugfix template"
    echo "  $0 auto              # Auto-detect from branch"
    echo "  $0 docs ~/pr.md      # Create docs template at custom path"
    exit 0
    ;;
  *)
    echo "Unknown template type: $TEMPLATE_TYPE"
    echo "Use --help for available options"
    exit 1
    ;;
esac

echo "✅ PR description template created at: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "1. Edit the template: ${EDITOR:-vim} $OUTPUT_FILE"
echo "2. Create PR: scripts/create_pr.sh 'Your PR title'"

# Optionally open in editor
read -p "Open in editor now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  ${EDITOR:-vim} "$OUTPUT_FILE"
fi