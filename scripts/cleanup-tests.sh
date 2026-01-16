#!/bin/bash

# Whitelisted paths
WHITELIST=(
    "scripts/docker-test-runner.sh"
    "src/routes/tests/"
    "tests/"
)

# Function to check if a path is whitelisted
is_whitelisted() {
    local path="$1"
    for white in "${WHITELIST[@]}"; do
        if [[ "$path" == "$white"* ]]; then
            return 0
        fi
    done
    return 1
}

# Run fd test and process results
fd test --hidden --no-ignore | while read -r target; do
    if is_whitelisted "$target"; then
        echo "Skipping whitelisted: $target"
        continue
    fi

    if [ -e "$target" ]; then
        echo "Processing: $target"
        rm -rf "$target"
        git add .
        git commit --signoff -m "rm $target"
        echo "Committed removal of $target"
    else
        echo "File not found (likely already removed): $target"
    fi
done

echo "Cleanup complete."
