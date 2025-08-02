#!/bin/bash

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DOCKER_COMPOSE_FILE="${SCRIPT_DIR}/../docker/docker-compose.yml"
SERVICE_NAME="agent-one-playwright-test-runner"

echo "--- Checking if Playwright test runner image is built ---"
if ! docker compose -f "${DOCKER_COMPOSE_FILE}" images -q "${SERVICE_NAME}" | grep -q .; then
    echo "Image for '${SERVICE_NAME}' not found. Building now..."
    docker compose -f "${DOCKER_COMPOSE_FILE}" build || { echo "Error: Docker image build failed!"; exit 1; }
    echo "Image built successfully."
else
    echo "Image for '${SERVICE_NAME}' already exists."
fi

echo "--- Checking if Playwright test runner container is running ---"
if ! docker compose -f "${DOCKER_COMPOSE_FILE}" ps -q "${SERVICE_NAME}" | grep -q .; then
    echo "Container for '${SERVICE_NAME}' not running. Starting now..."
    docker compose -f "${DOCKER_COMPOSE_FILE}" up -d "${SERVICE_NAME}" || { echo "Error: Docker container startup failed!"; exit 1; }
    echo "Container started successfully."
    sleep 3
else
    echo "Container for '${SERVICE_NAME}' is already running."
fi

if [ -z "$@" ]; then
    echo "No command provided to execute inside the container."
    echo "Usage: $0 <command_to_run_in_container>"
    echo "Example: $0 bash"
    echo "Example: $0 npx playwright test"
    exit 1
fi

echo "--- Executing command in container: '$@' ---"
docker compose -f "${DOCKER_COMPOSE_FILE}" exec "${SERVICE_NAME}" "$@"
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "Command execution within container failed with exit code $EXIT_CODE."
fi

exit $EXIT_CODE
