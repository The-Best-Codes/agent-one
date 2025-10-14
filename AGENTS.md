# AGENTS.md

## Acceptable commands

Assume that these bash commands are allowed and no others unless specified:

- Run typecheck: `npm run typecheck`
- Run ESLint: `npm run lint`
- Format project (Prettier & cargo fmt): `npm run format`

## App philosophy

See [PHILOSOPHY.md](PHILOSOPHY.md).

## Tailwind Guidelines

- The Tailwind version is v4.
- There is no Tailwind config file. Config goes in the CSS file.
- Use `size-*` instead of `w-* h-*` when the width and height are the same. Example: Use `size-16` instead of `w-16 h-16`, but keep `w-16 h-12` for different sizes.
- Don't add margins to icons inside the `src/components/ui/button.tsx` component, as it already has the `gap-2` class.
- Don't overuse `space-*` classes. When possible, use a flex layout with a gap instead.
