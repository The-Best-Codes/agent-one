# AGENTS.md

## Useful commands

- Run typecheck: `npm run typecheck`
- Run ESLint: `npm run lint`
- Run ESLint with fix: `npm run lint -- --fix` (run this to fix import order issues)
- Format project (Prettier & cargo fmt): `npm run format`
- Run Rust check: `cd src-tauri && cargo check`
- Run Rust clippy: `cd src-tauri && cargo clippy` (preferred over `cargo check`)
- Install dependencies: `npm install *` or `cargo add *`
- Search GitHub issues, PRs, and more for this repo: `gh` commands. Repo is The-Best-Codes/agent-one. Try to use read-only `gh` commands primarily and ask or be wary of using read-write `gh` CLI commands.

## UI Guidelines

- The Tailwind version is v4.
- There is no Tailwind config file. Config goes in the CSS file.
- Use `size-*` instead of `w-* h-*` when the width and height are the same. Example: Use `size-16` instead of `w-16 h-16`, but keep `w-16 h-12` for different sizes.
- Don't add margins to icons inside the `src/components/ui/button.tsx` component, as it already has the `gap-2` class.
- Don't overuse `space-*` classes. When possible, use a flex layout with a gap instead.
- This project uses shadcn/ui components as a base in `src/components/ui/`. Avoid editing the UI components directly when possible.
- The UI components are consistent and align with the project's design system. Unless you have a good reason, avoid applying custom classnames or other styling to the UI components when you use them in a file, customize them via props where possible and leave the styling at its default.
- To add a new UI component, run `npx shadcn@latest add *`. Only add new UI components when necesarry. If the install step fails, ask the user to add the component manually for you.

## Code Style

- As an AI, you should only add comments to the code when absolutely necessary. You should confirm before removing TODOs, TODO comments, or other important comments. The developer's job is to touch up your code, including writing comments, not your job.
- Follow the project PHILOSOPHY.md (don't forget to read the file).

## Docs

- Don't hesitate to browse the web for documentation.
- AI SDK docs are in `node_modules/ai/docs`.

## Installing Dependencies

- Don't manually edit the `package.json` file. Instead, use `npm install` to install dependencies.
- Don't manually edit the `Cargo.toml` file. Instead, use `cargo add` to install dependencies.
