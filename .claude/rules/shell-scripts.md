# Shell scripts

- On NixOS use `#!/usr/bin/env bash` as the shebang in every shell script, never `#!/bin/bash`, which does not exist there.
- Use `gojq` instead of `jq` in scripts, tests and shell commands. Switch an existing script only when the change is in scope.
