The goal of this branch (best/finish-mcp-servers) is to implement these main things:

## Experimentation

- Experiment with MCP server loading techniques. Load them in the background on app startup? Load them the first time a chat starts (like currently)?
- Whatever we do, load them in parallel. Perhaps add a TODO to utilize all CPU cores but for now default to 8 loading in parallel.
- If we keep the current approach of loading them on the first chat interaction, consider: When MCP servers are starting, show "Starting MCP server..." instead of "Thinking..." in the AI message loading indicator.

## Implementation

- Allow managing multiple MCP servers in a user-friendly way in settings.
- Implement some sort of timeout mechanism to prevent infinite loading of MCP servers, and allow customizing it per-server.
- Don't run any MCP logic at all when no MCP servers are configured or enabled.

## COURSE 1

I just thought of a good idea:

- Load MCP servers in the background on app startup. Fire-and-forget so it doesn't block the UI or startup.
- When a chat is started, if the MCP servers aren't loaded yet, wait for them to finish. Otherwise, they are instantly available.
- Create a `use-mcp` context + hook and use it in src/lib/ai/tools/index.ts to get the MCP servers.
- No custom cache strategy should be needed in mcp.ts anymore because the use-mcp context should be stable and handle that.
- Keep in mind while building: Support for multiple MCP servers, enabling/disabling them in settings and updating the context and cleaning up resources when necessary.
