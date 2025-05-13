#!/usr/bin/env zsh

if [[ -z "${KEYCHAIN_KEYS}" ]]; then
  echo "KEYCHAIN_KEYS not set, skipping keychain"
  exit 1
fi

if [[ "$(uname)" == "Darwin" ]]; then
  killall ssh-agent
  eval "$(ssh-agent)"

  stringList="$KEYCHAIN_KEYS"
  keys=(${(s: :)stringList})
  for key in "${keys[@]}"; do
    if [[ "$(uname)" == "Darwin" ]]; then
      ssh-add --apple-use-keychain ~/.ssh/$key 2>/dev/null
    fi
  done
  exit 0 
fi

eval $(keychain --quiet --ssh-spawn-gpg --eval $GPGKEY)
eval $(keychain --quiet --eval $KEYCHAIN_KEYS)

mkdir -p ~/tmp
touch ~/tmp/keychain_init_done
