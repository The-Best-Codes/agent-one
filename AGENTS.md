# AGENTS.md

If you are an AI agent, please follow the instructions in this file to ensure you align with the project's expectations for AI agents.

## Useful Commands

- Run typecheck: `bun run typecheck`
- Run ESLint: `bun run lint`
- Run ESLint with fix: `bun run lint -- --fix` (run this to fix import order issues)
- Format project (oxfmt & cargo fmt): `bun run fmt`
- Run Rust check: `cd src-tauri && cargo check`
- Run Rust clippy: `cd src-tauri && cargo clippy` (preferred over `cargo check`)
- Install dependencies: `bun install *` or `cargo add *`
- Search GitHub issues, PRs, and more for this repo: `gh` commands. Repo is `The-Best-Codes/agent-one`. Try to use read-only `gh` commands primarily and ask or be wary of using read-write `gh` CLI commands.

### Installing Dependencies

- Don't manually edit the `package.json` file. Instead, use `bun install` to install dependencies.
- Don't manually edit the `Cargo.toml` file. Instead, use `cargo add` to install dependencies.

## UI Guidelines

- The Tailwind version is v4.
- There is no Tailwind config file. Config goes in the CSS file.
- Use `size-*` instead of `w-* h-*` when the width and height are the same. Example: Use `size-16` instead of `w-16 h-16`, but keep `w-16 h-12` for different sizes.
- Don't add margins to icons inside the `src/components/ui/button.tsx` component, as it already has the `gap-2` class.
- Don't overuse `space-*` classes. When possible, use a flex layout with a gap instead.
- This project uses shadcn/ui components as a base in `src/components/ui/`. Avoid editing the UI components directly when possible.
- Before you use a shadcn/ui component, use the shadcn skill if you haven't already. For each component you plan to use, use the shadcn CLI or browse the web to read its documentation.
- The UI components are consistent and align with the project's design system. Unless you have a good reason, avoid applying custom classnames or other styling to the UI components when you use them in a file, customize them via props where possible and leave the styling at its default.
- To add a new UI component, run `bunx shadcn@latest add *`. Only add new UI components when necessary. If the install step fails, ask the user to add the component manually for you.

## Code Style

- As an AI, you should only add comments to the code when absolutely necessary. You should confirm before removing TODOs, TODO comments, or other important comments. The developer's job is to touch up your code, including writing comments, not your job.
- Any time you use the Tauri SQL plugin, if you are creating new tables in the TypeScript codebase, you're almost certainly doing it wrong. You can create and apply migrations in `src-tauri/migrations/` (and update `src-tauri/lib.rs`) instead.
- Follow the project `PHILOSOPHY.md`.
- Never use a subagent unless the user explicitly told you to use one. If you **must** use a subagent, pause and ask the user if it's okay.

## Docs

- Don't hesitate to browse the web for documentation.
- AI SDK docs are in `node_modules/ai/docs`.
- MCP (Model Context Protocol, referred to as an "Extension" in the app) docs are in `.agents/docs/modelcontextprotocol.io/llms-full.txt`.
- General documentation for miscellaneous topics can be found in `.agents/docs/`.
- If you run ESLint and it returns warnings or errors that mention documentation URLs, ALWAYS fetch the documentation URLs first before attempting to resolve the issue so that you resolve it in alignment with the latest documentation.
