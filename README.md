# AgentOne

## Prerequisites

- Node.js
- npm
- Rust & Tauri https://tauri.app/start/prerequisites/

## Installation

Clone the repository using the following command:

```bash
git clone https://github.com/The-Best-Codes/agent-one.git
```

Install dependencies:

```bash
cd agent-one
npm install
```

Run the application:

```bash
npm run tauri dev
```

## Build

To build the application for production, run the following command:

```bash
npm run tauri build
```

You will need the [Tauri Prerequisites](https://tauri.app/start/prerequisites/) to build the application. On Windows, in addition to the prerequisites, you will need to install CMake, LLVM, and NASM as well.

- https://cmake.org/download/
- `winget install LLVM.LLVM`
- `winget install NASM.NASM`

### Signing Updates

See https://tauri.app/plugin/updater/.

## Updating Dependencies

- `npm update` and `cargo update` to update dependencies (safe)
- `cargo upgrade` to upgrade dependencies to the latest version (unsafe, test for breaking changes)
- `npx npm-check-updates -u` to update dependencies to the latest version (unsafe, test for breaking changes)
- `npx actions-up` to update actions in workflows (test manually in a PR)

---

Copyright © 2026 bestcodes.dev

All rights reserved.

This code is proprietary and confidential. No license is granted to use, copy, modify, distribute, or create derivative works of this software except with explicit written permission from the copyright holder.
