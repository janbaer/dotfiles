#!/usr/bin/env zsh

if [[ -z "${KEYCHAIN_KEYS}" ]]; then
  echo "KEYCHAIN_KEYS not set, skipping keychain"
  exit 1
fi

if [[ "$(uname)" == "Darwin" ]]; then
  killall ssh-agent
  eval "$(ssh-agent)"
fi

stringList="$KEYCHAIN_KEYS"

keys=(${(s: :)stringList})

for key in "${keys[@]}"; do
  if [[ "$(uname)" == "Darwin" ]]; then
    ssh-add --apple-use-keychain ~/.ssh/$key 2>/dev/null
  else
    eval $(keychain --quiet --agents ssh --eval "$key")
  fi
done

mkdir -p ~/tmp
touch ~/tmp/keychain_init_done
