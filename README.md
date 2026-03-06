# AgentOne

## Prerequisites

- Node.js
- npm
- Bun https://bun.com/
- Rust & Tauri https://tauri.app/start/prerequisites/

## Installation

Clone the repository using the following command:

```bash
git clone https://github.com/The-Best-Codes/agent-one.git
```

Install dependencies:

```bash
cd agent-one
bun install
```

Run the application:

```bash
bun run tauri dev
```

## Linting with OXLint (unstable)

Install `oxlint-tsgolint` without saving it to the package.json:

```bash
bun install --no-save oxlint-tsgolint
```

Run the linter:

```bash
bunx oxlint --type-aware
```

Or without types:

```bash
bunx oxlint
```

## Build

To build the application for production, run the following command:

```bash
bun run tauri build
```

You will need the [Tauri Prerequisites](https://tauri.app/start/prerequisites/) to build the application. On Windows, in addition to the prerequisites, you will need to install CMake, LLVM, and NASM as well.

- https://cmake.org/download/
- `winget install LLVM.LLVM`
- `winget install NASM.NASM`

### Signing Updates

See https://tauri.app/plugin/updater/.

## Updating Dependencies

- `bun update` and `cargo update` to update dependencies (safe)
- `cargo upgrade` to upgrade dependencies to the latest version (unsafe, test for breaking changes)
- `bunx npm-check-updates -u` to update dependencies to the latest version (unsafe, test for breaking changes)
- `bunx actions-up` to update actions in workflows (test manually in a PR)

## Testing

### With Playwright

- `bunx -y playwright install` to download browsers
- `bunx -y playwright test` to run all tests in all projects
- `bunx -y playwright test --project="chromium-desktop-light" --project="pixel-7-dark"` to run only fast Chromium tests

---

Copyright © 2026 bestcodes.dev

All rights reserved.

This code is proprietary and confidential. No license is granted to use, copy, modify, distribute, or create derivative works of this software except with explicit written permission from the copyright holder.
