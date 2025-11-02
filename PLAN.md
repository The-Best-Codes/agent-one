The goal of this branch (best/finish-mcp-servers) is to implement these main things:

## Experimentation

- Experiment with MCP server loading techniques. Load them in the background on app startup? Load them the first time a chat starts (like currently)?
- Whatever we do, load them in parallel. Perhaps add a TODO to utilize all CPU cores but for now default to 8 loading in parallel.
- If we keep the current approach of loading them on the first chat interaction, consider: When MCP servers are starting, show "Starting MCP server..." instead of "Thinking..." in the AI message loading indicator.

## Implementation

- Allow managing multiple MCP servers in a user-friendly way in settings.
- Implement some sort of timeout mechanism to prevent infinite loading of MCP servers, and allow customizing it per-server.
- Don't run any MCP logic at all when no MCP servers are configured or enabled.
