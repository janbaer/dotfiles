name: gitlab-mr-create
description: Create a new GitLab MergeRequest
argument-hint: title (optional)
---

Create a new merge-request with using the gitlab-mcp server. If gitlab-mcp server is not available, inform the user that the gitlab-mcp server is not connected, and **abort immediately**.

The title for the merge-request has to start with the Jira issue number.

If the title is given as argument, the Jira number should already be there. If not check the commits for the current feature branch and take it from the first line of the commits. The issue has the format VERBU-12345.

Identify the changes and provide a concise, insightful description.

## Best Practices

1. **Review before submitting**: Ensure description is complete and accurate
2. **Be specific**: Only add important information, the reviewer should know to be able to quickly understand
3. **Link issues**: Always reference the Jira issue. The link for the issues have the following format https://c24-vorsorge.atlassian.net/browse/VERBU-12345
