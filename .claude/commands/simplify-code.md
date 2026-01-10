---
name: simplify-code
description: Simplify code using the code-simplifier agent
---

Simplify code to reduce complexity and improve readability using the code-simplifier agent.

## Usage

This command can be used in two ways:

1. **With a file argument**: `/simplify-code <file-path>` - Simplifies the specified file
2. **Without arguments**: `/simplify-code` - Simplifies currently staged changes

## Execution Steps

1. Check if a file path was provided as an argument:
   - If yes, use that file as the focus for simplification
   - If no, check for staged changes using `git diff --staged --name-only`

2. If no file argument and no staged changes exist, inform the user:
   "No file specified and no staged changes found. Please either provide a file path or stage changes to simplify."

3. Use the Task tool with `subagent_type: "pr-review-toolkit:code-simplifier"` to analyze and simplify the code:
   - For a specific file: Focus the agent on that file
   - For staged changes: Focus the agent on all staged files

4. The agent will:
   - Identify overly complex code patterns
   - Suggest simplifications
   - Provide concrete refactoring recommendations
   - Explain how the simplifications improve readability and maintainability

## Best Practices

- Review the agent's suggestions carefully before applying changes
- Consider the trade-offs between simplicity and other factors (performance, compatibility)
- Use this command iteratively on different files or sections of code
- Run tests after applying simplifications to ensure functionality is preserved
