#!/usr/bin/env sh
set -eu
TARGET="${1:-}"
IDE="${2:-all}"
[ -n "$TARGET" ] || { echo 'Usage: install.sh /existing/project [claude|cursor|codex|gemini|copilot|all]' >&2; exit 2; }
ROOT="$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)"
node "$ROOT/packages/cli/index.mjs" install --target "$TARGET" --ide "$IDE"
