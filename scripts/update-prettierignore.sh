#!/bin/bash

{
    # Find all .gitignore and .prettierignore files in subdirectories
    find . -name ".gitignore" -o -name ".prettierignore" | grep -v "^\./\.gitignore$\|^\./\.prettierignore$" | sort | while read file; do
        dir=$(dirname "$file")

        echo "# from $file"

        # Read each line and prepend the directory path
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

            # Trim leading whitespace
            pattern="${line##[[:space:]]*}"

            # Check if negation pattern
            if [[ "$pattern" =~ ^! ]]; then
                negation="!"
                pattern="${pattern#\!}"
            else
                negation=""
            fi

            # Strip leading / (absolute path in .gitignore)
            if [[ "$pattern" =~ ^/ ]]; then
                pattern="${pattern:1}"
            else
                # Add **/ to match at any depth for relative patterns
                pattern="**/$pattern"
            fi

            # Build final path with negation (strip leading ./ from dir)
            dir="${dir#./}"
            echo "${negation}${dir}/${pattern}"
        done < "$file"

        # Add blank line between sections
        echo ""
    done
} > .prettierignore
