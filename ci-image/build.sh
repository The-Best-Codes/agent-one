#!/bin/bash

set -e

IMAGE_NAME="${IMAGE_NAME:-ghcr.io/the-best-codes/agent-one-base-ci}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

PLATFORM="${PLATFORM:-linux/amd64}"

PUSH="${PUSH:-false}"

echo "Building Docker image: ${FULL_IMAGE}"
echo "Platform: ${PLATFORM}"
echo ""

docker buildx build \
  --platform "${PLATFORM}" \
  --tag "${FULL_IMAGE}" \
  --file Dockerfile \
  $([ "${PUSH}" = "true" ] && echo "--push" || echo "--load") \
  .

echo ""
echo "Build completed successfully!"
echo "Image: ${FULL_IMAGE}"

if [ "${PUSH}" = "true" ]; then
  echo "Pushed to registry"
else
  echo "Loaded to local Docker"
fi
