# PR Description Templates

Use these templates as the `body` when calling `create_pull_request`. Choose the type that matches the nature of the change.

## Feature

```
## Summary

- What the feature does and why it was added

## Changes

- List of notable changes

## Testing

- How this was tested

closes #N
```

## Bugfix

```
## Summary

- What was broken and root cause

## Fix

- What was changed to fix it

## Testing

- How the fix was verified
- Regression: how to confirm the bug doesn't recur

closes #N
```

## Hotfix

```
## Summary

- What is broken in production and severity

## Fix

- What was changed

## Rollback

- How to revert if needed

closes #N
```

## Documentation

```
## Summary

- What documentation was updated and why

## Changes

- Files or sections changed

## Verification

- How to confirm the docs are correct
```

## Refactor

```
## Summary

- Motivation for the refactor

## Changes

- What changed structurally (no functional changes)

## Performance impact

- Any measured or expected impact
```

## Best Practices

1. Replace all placeholder text with actual details
2. Always reference related issues with `closes #N`
3. Include test output, screenshots, or metrics where relevant
4. Keep it concise — a good PR description explains *why*, not just *what*
