#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT_DIR}"
DEST="${ROOT_DIR}/docker/cached"

mkdir -p "${DEST}"

echo "--- Using rsync with .dockerignore filters to sync ---"
rsync -a --delete \
  --filter=':- .dockerignore' \
  "${SRC}/" "${DEST}/"

echo "Synced to ${DEST}"
