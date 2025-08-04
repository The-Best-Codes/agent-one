#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT_DIR}"
DEST="${ROOT_DIR}/docker/cached"

mkdir -p "${DEST}"

if command -v git >/dev/null 2>&1 && [ -d "${ROOT_DIR}/.git" ]; then
  echo "--- Using rsync with .gitignore filters to sync ---"
  rsync -a --delete --delete-excluded \
    --filter=':- .gitignore' \
    "${SRC}/" "${DEST}/"
else
  echo "--- git not available; falling back to rsync with .dockerignore excludes ---"
  EXCLUDE_FILE="${ROOT_DIR}/.dockerignore"
  if [ -f "${EXCLUDE_FILE}" ]; then
    rsync -a --delete --delete-excluded \
      --exclude-from="${EXCLUDE_FILE}" \
      "${SRC}/" "${DEST}/"
  else
    rsync -a --delete --delete-excluded "${SRC}/" "${DEST}/"
  fi
fi

echo "Synced to ${DEST}"
