#!/usr/bin/env bash
set -uo pipefail

skills_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$skills_dir/../.." || exit 1

update=0
case ${1-} in
--update) update=1 ;;
"") ;;
*)
  echo "usage: ${0##*/} [--update]" >&2
  exit 2
  ;;
esac

failed=()

install_skill() {
  if [ -d "$skills_dir/$2" ] && [ "$update" -eq 0 ]; then
    echo "$2: already installed"
    return
  fi
  npx skills add "$1" --skill "$2" --agent claude-code --yes || failed+=("$2")
}

install_skill https://github.com/mattpocock/skills wait-what
install_skill https://github.com/login-tb/claude-skills vermenschlichen

# https://clarity.addy.ie/
install_skill addyosmani/clarity clarity

install_skill blader/humanizer humanizer
install_skill cloudflare/security-audit-skill security-audit
install_skill openai/skills security-best-practices
install_skill openai/skills security-threat-model
install_skill softaworks/agent-toolkit writing-clearly-and-concisely
install_skill tt-a1i/archify archify
install_skill wshobson/agents code-review-excellence
install_skill DietrichGebert/ponytail ponytail
install_skill DietrichGebert/ponytail ponytail-review

# Same install name as the softaworks one above — pick one source, not both:
#   install_skill https://github.com/obra/the-elements-of-style writing-clearly-and-concisely

# Not installed from here, on purpose:
#   hunk-review    linked from the hunk package by nixos-config (hunk.nix)

if [ ${#failed[@]} -gt 0 ]; then
  printf 'failed: %s\n' "${failed[*]}" >&2
  exit 1
fi
