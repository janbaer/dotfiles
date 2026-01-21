---
name: jira-ticket
description: Draft and create a JIRA ticket (Story, Bug, or Maintenance task) directly via the JIRA REST API
argument-hint: summary
---

# JIRA Ticket Drafter

You help draft well-structured JIRA tickets by gathering the necessary information interactively, with the option to create the ticket directly in JIRA via the REST API.

## Pre-requisites

Check at the beginning if the required environment variables are set. Otherwise tell the user what is missing and abort the command.
So the following environment variables needs to be set

- JIRA_EMAIL
- JIRA_API_TOKEN

## JIRA Configuration

- **JIRA_URL:** From `JIRA_URL` environment variable, defaults to `https://c24-vorsorge.atlassian.net`
- **Email:** From `JIRA_EMAIL` environment variable
- **API Token:** From `JIRA_API_TOKEN` environment variable
- **Default Project:** From `JIRA_PROJECT` environment variable, defaults to `VERBU`

## User Input

Summary (if provided as argument): $ARGUMENTS

If $ARGUMENTS is provided, use it as the **Summary** and skip asking for it in Step 2.

Guess from the passed summary what type of ticket it could be.
So the word `fix` sounds like a bug. If it start with `Infrastructure` it is usually a maintenance task. So you can preselect the ticket type, but always ask the user what type it should be

## Process

### Step 1: Determine Ticket Type

If not already specified, ask the user:

"What type of JIRA ticket do you want to create?

1. Story - A user story or feature request
2. Bug - Report a defect or unexpected behavior
3. Maintenance task - Technical work, refactoring, or maintenance

Choose (1-3):"

### Step 2: Gather Information Based on Type

#### For Stories:
Ask these questions (user can skip with 'skip' or '-'):
1. **Summary**: Brief description of the story (one-line)
2. **Priority**: How important is this? (High/Medium/Low)
3. **Description**: Ask the user to elaborate on the story
4. **TODO**: What tasks need to be done? (will appear in red panel)
5. **Acceptance Criteria**: How do we verify it's complete? (will appear in red panel)

#### For Bugs:
Ask these questions (user can skip with 'skip' or '-'):
1. **Summary**: What is the bug? (one-line description)
2. **Environment**: Where does this occur? (browser, OS, version, etc.)
3. **Steps to Reproduce**: How can someone recreate this issue?
4. **Expected Behavior**: What should happen?
5. **Actual Behavior**: What actually happens?
6. **Severity**: How critical is this? (Critical/High/Medium/Low)
7. **Screenshots/Logs**: Any additional context?
8. **TODO**: What tasks need to be done to fix it? (will appear in red panel)
9. **Acceptance Criteria**: How do we verify it's fixed? (will appear in red panel)

#### For Maintenance tasks:
Ask these questions (user can skip with 'skip' or '-'):
1. **Summary**: What needs to be done? (one-line description)
2. **Description**: Detailed explanation of the task
3. **Motivation**: Why is this maintenance needed?
4. **TODO**: What tasks need to be done? (will appear in red panel)
5. **Acceptance Criteria**: How do we verify it's complete? (will appear in red panel)
6. **Dependencies**: Are there blockers or prerequisites?
7. **Priority**: How urgent is this? (High/Medium/Low)

### Step 3: Generate the Ticket

Store the ticket data internally for API submission and format a markdown preview:

```markdown
## Summary

**Type:** Story/Bug/Maintenance task
**Priority:** High/Medium/Low
**Project:** VERBU

### Description
[Formatted description based on gathered info]

### TODO (each item in separate red panel)
- Todo item 1
- Todo item 2
- ...

### Acceptance Criteria (each item in separate red panel)
- Criterion 1
- Criterion 2
- ...

### Additional Information
[Any extra context, links, screenshots mentioned]
```

### Step 4: Present and Refine

Check for grammar errors and fix them.

Show the draft to the user as markdown, then use the AskUserQuestion tool to present these options as an interactive selection:

1. **Create in JIRA** - Submit the ticket to JIRA via the REST API
2. **Make changes** - Edit specific fields in the ticket
3. **Add more details** - Provide additional information
4. **Start over** - Discard this draft and begin again

If the user wants changes, make the requested edits and show the updated version.

### Step 5: Create in JIRA (if selected)

When the user selects "Create in JIRA":

1. **Convert description to Atlassian Document Format (ADF):**

   The JIRA Cloud API requires descriptions in ADF format. Convert the markdown description to ADF structure:
   - Paragraphs become `{"type": "paragraph", "content": [{"type": "text", "text": "..."}]}`
   - Bold text becomes `{"type": "text", "text": "...", "marks": [{"type": "strong"}]}`
   - Bullet lists become `{"type": "bulletList", "content": [{"type": "listItem", "content": [...]}]}`
   - Numbered lists become `{"type": "orderedList", "content": [{"type": "listItem", "content": [...]}]}`
   - Headings become `{"type": "heading", "attrs": {"level": N}, "content": [{"type": "text", "text": "..."}]}`
   - **Panels** structure:
     ```json
     {
       "type": "panel",
       "attrs": { "panelType": "<TYPE>" },
       "content": [
         {
           "type": "paragraph",
           "content": [{ "type": "text", "text": "Panel content here" }]
         }
       ]
     }
     ```
   - Panel types: "info" (blue), "note" (purple), "warning" (yellow), "success" (green), "error" (red)
   - **TODO section** → use **"error"** panel (red) - will be switched to success when completed
   - **Acceptance Criteria section** → use **"error"** panel (red)
   - Place the section heading (e.g., "TODO", "Acceptance criteria") **outside** the panels as a regular heading
   - **Each item gets its own separate panel** - do NOT group multiple items in one panel
   - Example for multiple TODOs:
     ```json
     { "type": "heading", "attrs": { "level": 3 }, "content": [{ "type": "text", "text": "TODO" }] },
     { "type": "panel", "attrs": { "panelType": "error" }, "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "First todo item" }] }] },
     { "type": "panel", "attrs": { "panelType": "error" }, "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Second todo item" }] }] }
     ```

2. **Create the issue via API using environment variables for authentication:**
   ```bash
   curl -s -X POST \
     -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
     -H "Content-Type: application/json" \
     -d '{
       "fields": {
         "project": { "key": "'"$JIRA_PROJECT"'" },
         "summary": "<SUMMARY>",
         "issuetype": { "name": "<TYPE>" },
         "priority": { "name": "<PRIORITY>" },
         "description": {
           "type": "doc",
           "version": 1,
           "content": [<ADF_CONTENT>]
         }
       }
     }' \
     "${JIRA_URL}/rest/api/3/issue"
   ```

3. **Handle the response:**
   - On success: Extract the issue key from the response and show:
     "Issue created successfully: VERBU-XXXXX
     View it at: https://c24-vorsorge.atlassian.net/browse/VERBU-XXXXX"
   - On error: Show the error message from the API response

## Issue Type Mapping

Map the user-selected types to JIRA issue types:
- Story → "Story"
- Bug → "Bug"
- Maintenance task → "Maintenance task"

## Priority Mapping

Map priorities to JIRA priority names:
- Critical → "Highest"
- High → "High"
- Medium → "Medium"
- Low → "Low"

## Guidelines

- Keep language clear and concise
- Use bullet points for lists
- Format acceptance criteria as checkboxes in markdown preview
- Include all relevant technical details
- If the user provides partial info via $ARGUMENTS, pre-fill what you can and ask only for missing details
- When creating in JIRA, ensure all special characters in text are properly escaped for JSON
- **TODO section** → each item in its own **"error"** panel (red) - switched to success when done
- **Acceptance Criteria section** → each item in its own **"error"** panel (red)
