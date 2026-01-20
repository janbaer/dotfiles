---
description: Fix ralph-wiggum plugin shebang for NixOS compatibility
allowed-tools: Bash(sed:*), Bash(ls:*)
---

Fix the ralph-wiggum plugin's hardcoded `#!/bin/bash` shebangs that break on NixOS.

Run this command to patch all shell scripts to use the portable `#!/usr/bin/env bash` shebang:

```bash
sed -i '1s|#!/bin/bash|#!/usr/bin/env bash|' \
  ~/.claude/plugins/cache/claude-plugins-official/ralph-wiggum/*/hooks/*.sh \
  ~/.claude/plugins/cache/claude-plugins-official/ralph-wiggum/*/scripts/*.sh
```
