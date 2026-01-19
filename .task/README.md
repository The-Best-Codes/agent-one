## Task

1. Move MCP implementation to the backend and invoke it using Tauri (https://v2.tauri.app/reference/javascript/api/namespaceevent/, https://v2.tauri.app/develop/calling-frontend/). Currently, the MCP implementation is located in the frontend. We can use rmcp for this (goose/, rust-sdk/).
2. Support all MCP server types (SSE, HTTP, and STDIO), not just STDIO.
3. Support OAuth for all MCP server types that support it (see goose/ repo for a working implementation of OAuth).

## Docs

From the repo root, these helpful docs and example repos are available:

- .task/goose: goose has a fully working implementation of STDIO, HTTP, and SSE MCP servers complete with OAuth support.
- .task/rust-sdk: This is the source code for the rmcp crate.

Be sure to view them fully in context when needed to understand the implementation details.
