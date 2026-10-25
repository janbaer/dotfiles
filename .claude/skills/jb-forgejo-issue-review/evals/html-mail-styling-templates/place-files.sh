#!/usr/bin/env bash
set -eu
git clone -q "$HOME/Projects/hermes-scripts" repo
git -C repo checkout -q af86ae8^
cp "$(dirname "$0")/files/ticket.md" .
