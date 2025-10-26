# PR Description Templates

This directory contains templates for different types of pull requests. Use these as starting points for your PR descriptions.

## Quick Usage

```bash
# Generate template based on branch name
scripts/generate_pr_description.sh auto

# Generate specific template type
scripts/generate_pr_description.sh feature
scripts/generate_pr_description.sh bugfix
scripts/generate_pr_description.sh hotfix
```

## Template Types

### Feature Template
Use for new features and enhancements.
- Focuses on motivation and implementation
- Includes testing checklist
- Links to related issues

### Bugfix Template
Use for bug fixes.
- Emphasizes root cause analysis
- Documents testing approach
- Includes regression prevention

### Hotfix Template
Use for critical production fixes.
- Includes severity assessment
- Documents rollback plan
- Requires immediate action items

### Documentation Template
Use for documentation updates.
- Lists types of documentation changed
- Includes quality checklist
- Links verification

### Refactor Template
Use for code refactoring.
- Documents motivation for changes
- Ensures no functional changes
- Performance impact assessment

## Customization

Templates can be customized by:
1. Editing the `generate_pr_description.sh` script
2. Creating custom template files in this directory
3. Using environment variables for dynamic content

## Best Practices

1. **Be specific**: Replace placeholder text with actual details
2. **Complete checklists**: Don't leave checkboxes unchecked without reason
3. **Link issues**: Always reference related issues
4. **Add evidence**: Include test output, screenshots, or metrics
5. **Review before submitting**: Ensure description is complete and accurate