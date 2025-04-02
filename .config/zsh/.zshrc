# zmodload zsh/zprof # Enable profiling

################################################################
# This config is heavily inspired from this two repos
# https://github.com/dreamsofautonomy/zensh/tree/main
# https://github.com/dreamsofautonomy/dotfiles
# Documentations of zinit and p10k are lsite below
# https://github.com/zdharma-continuum/zinit
# https://github.com/romkatv/powerlevel10k
################################################################

# Set the GPG_TTY to be the same as the TTY, either via the env var
# or via the tty command.
if [ -n "$TTY" ]; then
  export GPG_TTY=$(tty)
else
  export GPG_TTY="$TTY"
fi

export PATH="/usr/local/bin:/usr/bin:$PATH"

# Source local zshrc with local only settings
[[ -f $ZDOTDIR/.zshrc.local ]] && source $ZDOTDIR/.zshrc.local

# Enable Powerlevel10k instant prompt. Should stay close to the top of $HOME/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

autoload -Uz compinit
# Load zcompdump only once a day
for dump in $HOME/.zcompdump(N.mh+24); do
  compinit
done
compinit -C

ZINIT_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}/zinit/zinit.git"
# Download Zinit, if it's not there yet
if [ ! -d "$ZINIT_HOME" ]; then
   mkdir -p "$(dirname $ZINIT_HOME)"
   git clone https://github.com/zdharma-continuum/zinit.git "$ZINIT_HOME"
fi

source "${ZINIT_HOME}/zinit.zsh"

# Define list of plugins that should be used
zinit light ohmyzsh/ohmyzsh
zinit ice depth=1; zinit light romkatv/powerlevel10k
# zinit snippet OMZP::aws
# zinit snippet OMZP::kubectl
# zinit snippet OMZP::kubectx
zinit snippet OMZP::rust
zinit snippet OMZP::volta
zinit snippet OMZP::command-not-found

zinit light zsh-users/zsh-completions
zinit light zsh-users/zsh-autosuggestions
zinit light zsh-users/zsh-syntax-highlighting

export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# [[ -f $HOME/.profile ]] && source $HOME/.profile
# if [ Linux = `uname` ]; then
  # [[ -f $HOME/.profile-linux ]] && source $HOME/.profile-linux
# fi
# if [ Darwin = `uname` ]; then
#   [[ -f ~$HOME/.profile-macos ]] && source $HOME/.profile-macos
# fi

setopt auto_cd

alias sudo='sudo '
export LD_LIBRARY_PATH=/usr/local/lib

# P10k customizations
# To customize prompt, run `p10k configure` or edit $HOME/.p10k.zsh.
[[ -f $HOME/.p10k.zsh ]] && source $HOME/.p10k.zsh

# Fix for password store
export PASSWORD_STORE_GPG_OPTS='--no-throw-keyids'

bindkey "^P" up-line-or-beginning-search
bindkey "^N" down-line-or-beginning-search

# Capslock command
alias capslock="sudo killall -USR1 caps2esc"

if [ "$XDG_SESSION_TYPE" = "wayland" ]; then
  export MOZ_ENABLE_WAYLAND=1
fi

zle_highlight=('paste:none')

source $ZDOTDIR/.exports
source $ZDOTDIR/.aliases
source $ZDOTDIR/.functions

if [[ $(uname) == 'Darwin' ]]; then
  [ -f $ZDOTDIR/.zshrc.macos ] && source $ZDOTDIR/.zshrc.macos
fi

[ -f $HOME/.fzf-init.zsh ] && source $HOME/.fzf-init.zsh

# Some kubernetes things
[ -f $HOME/.kube/kube-config.yaml ] && export KUBECONFIG=$HOME/.kube/kube-config.yaml

[ -f $HOME/.cargo/env ] && source $HOME/.cargo/env

# Source local zshrc with local bu specific settings, if file exists
[ -f $ZDOTDIR/.zshrc.bu ] && source $ZDOTDIR/.zshrc.bu

export KEYCHAIN_KEYS="$KEYCHAIN_KEYS_LOCAL $KEYCHAIN_KEYS_BU"
[ -f $HOME/tmp/keychain_init_done ] && source $HOME/bin/init-keychain.sh

# Config keys for Atuin together with Fzf and run init for Zsh
[ -f $HOME/.config/atuin/atuin-setup.sh ] && source $HOME/.config/atuin/atuin-setup.sh

# zoxide (better `cd`)
# ------------------------------------------------------------------------------
if type zoxide &>/dev/null; then
  eval "$(zoxide init zsh --cmd cd)"
fi

# zprof # Show profiling result
