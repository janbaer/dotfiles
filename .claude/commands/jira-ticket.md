---
name: jira-ticket
description: Draft a well-structured JIRA ticket (Story, Bug, or Maintenance task) for manual creation, or view an existing issue, using the Jira MCP server
argument-hint: summary or issue key (e.g. PROJ-123)
disable-model-invocation: true
---

# JIRA Ticket Drafter

You help draft well-structured JIRA tickets by gathering the necessary information interactively. This command never writes to JIRA — Jan is not allowed to have AI create or update tickets directly. The end product is always a draft (markdown, ready to paste) for Jan to create or apply himself.

## Pre-requisites

This command requires the **Jira MCP server** to be configured and available (used for `jira-get-issue` only — read access).

## User Input

Argument (if provided): $ARGUMENTS

## Detecting Create vs Update Mode

If $ARGUMENTS matches an issue key pattern (e.g. `PROJ-123`, `VERBU-456` — uppercase letters, a hyphen, then digits), enter **Update Mode**. Otherwise, enter **Create Mode** and treat $ARGUMENTS as the summary.

---

## Update Mode

### Step U1: Fetch the existing issue

Call `jira-get-issue` with the issue key from $ARGUMENTS.

If the API returns an error (issue not found), tell the user:
> "Issue {key} was not found. Please check the key and try again."

Then stop — do not proceed further.

### Step U2: Show current content

Display the current issue to the user:

```markdown
## {key}: {summary}

**Type:** {issueType} | **Status:** {status} | **Priority:** {priority}
**Assignee:** {assignee} | **Reporter:** {reporter}

### Description
{description rendered as readable text}
```

### Step U3: Ask what to change

Ask the user: "What would you like to change?"

Present options:
1. **Summary** — change the title
2. **Description** — rewrite the description
3. **Both** — change summary and description

For description changes, gather the new content interactively (same question flow as create mode based on the issue type, but pre-filled with existing content where possible). The user can skip fields they don't want to change.

### Step U4: Present the draft

Show the changes as a markdown diff against the current content (old → new for each changed field). Then present options:

1. **Copy draft** — finalize this as the output; Jan applies it in JIRA himself
2. **Make changes** — edit the draft further
3. **Cancel** — discard changes

Never call `jira-update-issue` or any other write tool. The diff itself is the deliverable — do not offer to submit it.

---

## Create Mode

If $ARGUMENTS is provided and is not an issue key, use it as the **Summary** and skip asking for it in Step 2.

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
4. **TODO**: What tasks need to be done?
5. **Acceptance Criteria**: How do we verify it's complete?

#### For Bugs:
Ask these questions (user can skip with 'skip' or '-'):
1. **Summary**: What is the bug? (one-line description)
2. **Environment**: Where does this occur? (browser, OS, version, etc.)
3. **Steps to Reproduce**: How can someone recreate this issue?
4. **Expected Behavior**: What should happen?
5. **Actual Behavior**: What actually happens?
6. **Severity**: How critical is this? (Critical/High/Medium/Low)
7. **Screenshots/Logs**: Any additional context?
8. **TODO**: What tasks need to be done to fix it?
9. **Acceptance Criteria**: How do we verify it's fixed?

#### For Maintenance tasks:
Ask these questions (user can skip with 'skip' or '-'):
1. **Summary**: What needs to be done? (one-line description)
2. **Description**: Detailed explanation of the task
3. **Motivation**: Why is this maintenance needed?
4. **TODO**: What tasks need to be done?
5. **Acceptance Criteria**: How do we verify it's complete?
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

### TODO
- Todo item 1
- Todo item 2
- ...

### Acceptance Criteria
- Criterion 1
- Criterion 2
- ...

### Additional Information
[Any extra context, links, screenshots mentioned]
```

### Step 4: Present and Refine

Check for grammar errors and fix them.

Show the draft to the user as markdown, then use the AskUserQuestion tool to present these options as an interactive selection:

1. **Copy draft** - Finalize this as the output; Jan creates the ticket in JIRA himself
2. **Make changes** - Edit specific fields in the ticket
3. **Add more details** - Provide additional information
4. **Start over** - Discard this draft and begin again

If the user wants changes, make the requested edits and show the updated version.

Never call `jira-create-issue` or any other write tool, and never offer "Create in JIRA" as an action — the finalized markdown draft is the deliverable.

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
- Use bullet points for lists in the markdown preview
- Format acceptance criteria as checkboxes in markdown preview
- Include all relevant technical details
- If the user provides partial info via $ARGUMENTS, pre-fill what you can and ask only for missing details
- This command is read-only against JIRA (`jira-get-issue` only) — never call `jira-create-issue` or `jira-update-issue`, and never present "Create/Update in JIRA" as an option, even if asked
