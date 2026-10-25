#!/usr/bin/env bash
set -eu
git clone -q "$HOME/Projects/hermes-scripts" repo
git -C repo checkout -q a7dcfb5
cp "$(dirname "$0")/files/ticket.md" .
