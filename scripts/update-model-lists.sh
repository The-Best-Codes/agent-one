#!/bin/bash

#
# Run this script from the root directory of the project or it will fail
#

# Set environment file path
ENV_FILE=".env"

# Source environment variables from .env file if it exists
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
fi

# Check required environment variables
if [ -z "$AGENT_ONE_GROQ_API_KEY" ] || [ -z "$AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY" ] || [ -z "$AGENT_ONE_CEREBRAS_API_KEY" ]; then
    echo "Error: Missing required API keys in environment or .env file"
    exit 1
fi

# Create public directory if it doesn't exist
mkdir -p ./src/assets/model-lists

# Download OpenRouter models
echo "Downloading OpenRouter models..."
curl -s "https://openrouter.ai/api/v1/models" -o ./src/assets/model-lists/openrouter-models.json

# Download Groq models
echo "Downloading Groq models..."
curl -s -H "Authorization: Bearer $AGENT_ONE_GROQ_API_KEY" "https://api.groq.com/openai/v1/models" -o ./src/assets/model-lists/groq-models.json

# Download Google models
echo "Downloading Google models..."
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY" -o ./src/assets/model-lists/google-models.json

# Download Cerebras models
echo "Downloading Cerebras models..."
curl -s -H "Authorization: Bearer $AGENT_ONE_CEREBRAS_API_KEY" "https://api.cerebras.ai/v1/models" -o ./src/assets/model-lists/cerebras-models.json

echo "Model lists updated successfully!"
