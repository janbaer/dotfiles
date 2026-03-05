---
name: review-diff
description: Review the diff between the current feature and the master or main branch
---

Review all commits made on this feature branch since it diverged from main.

## Getting the diff

```bash
git log main..HEAD --oneline        # overview of commits on this branch
git diff main...HEAD                # full diff since branch point
```

If the base branch is `master` instead of `main`, substitute accordingly.

If there are no commits ahead of main, inform the user that there is nothing to review.

## Best Practices for Reviews

- Check if it's a Node.js project and if `package.json` supports `yarn test` and `yarn lint` — if so, run both and report the results
- Check the changes for best practices based on the type of project
- Check for possible security issues (injection, exposed secrets, unsafe dependencies)
- Check for missing error handling at system boundaries (user input, external APIs)
- Be honest: say what you don't like and explain how it could be improved — don't just praise
