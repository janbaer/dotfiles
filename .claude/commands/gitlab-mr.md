name: gitlab-mr
description: Create a new GitLab MergeRequest
argument-hint: title (optional)
---

Create a new merge-request with using the gitlab-mcp server.

The title for the merge-request has to start with the Jira issue number.

If the title is given as argument, the jira number should already be there. If not check the commits for the current feature branch and take it from the first line of the commits. The issue has the format VERBU-12345.

Identify what about the changes are and decide which of the following templates should be used.

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

## Best Practices

1. **Be specific**: Replace placeholder text with actual details
2. **Complete checklists**: Don't leave checkboxes unchecked without reason
3. **Link issues**: Always reference related issues
4. **Add evidence**: Include test output, screenshots, or metrics
5. **Review before submitting**: Ensure description is complete and accurate
