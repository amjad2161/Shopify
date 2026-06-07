#!/usr/bin/env bash
# OneClick Hub — single install entrypoint (macOS / Linux)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "OneClick Hub setup — delegating to npm run setup:all"
exec npm run setup:all -- "$@"
