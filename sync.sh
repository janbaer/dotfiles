#!/bin/bash
cd "$(dirname "$0")"
git pull

# recompile VIM German spell file
nvim -e -s -c "mkspell! ~/Projects/dotfiles/.config/nvim/spell/de.utf-8.add" -c qa

copyFiles() {
  rsync --exclude ".git/" --exclude "sync.sh" --exclude "README.md" --exclude "terminal" --exclude "readme.md" --exclude "nvim" --exclude ".claude/settings.json" -av  . ~
}

copyFiles

if [ ! -d ~/.config/nvim ]; then
  echo "Create softlink for nvim"
  ln -s ~/Projects/dotfiles/.config/nvim ~/.config/nvim
fi
