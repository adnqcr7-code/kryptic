#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if ! command -v node >/dev/null 2>&1; then
  echo "Kryptic requires Node.js 20 or newer. Install Node.js, then run this script again." >&2
  exit 1
fi
node src/cli.js start
