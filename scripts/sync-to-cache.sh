#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT_DIR}"
DEST="${ROOT_DIR}/docker/cached"

mkdir -p "${DEST}"

if command -v git >/dev/null 2>&1 && [ -d "${ROOT_DIR}/.git" ]; then
  echo "--- Using git ls-files to compute sync set (respects .gitignore) ---"
  # Compose list of files to sync:
  # 1) Tracked files
  # 2) Untracked but not ignored files
  FILES=$(cd "${SRC}" && git ls-files && git ls-files --others --exclude-standard)

  rsync -a --delete --files-from=<(printf "%s\n" "${FILES}") "${SRC}/" "${DEST}/"
else
  echo "--- git not available; falling back to rsync with .dockerignore excludes ---"
  EXCLUDE_FILE="${ROOT_DIR}/.dockerignore"
  if [ -f "${EXCLUDE_FILE}" ]; then
    rsync -a --delete \
      --exclude-from="${EXCLUDE_FILE}" \
      "${SRC}/" "${DEST}/"
  else
    rsync -a --delete "${SRC}/" "${DEST}/"
  fi
fi

echo "Synced to ${DEST}"
