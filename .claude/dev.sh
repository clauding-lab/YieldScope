#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "/Users/adnanrashid/Downloads/Claude Code/YieldScope" || exit 1
exec node node_modules/.bin/vite --host --port "${PORT:-5173}"
