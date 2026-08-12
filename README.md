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

## Running react-doctor

Run the react-doctor linter:

```bash
bunx -y react-doctor@latest .
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
- Also, make sure `git` is installed

On macOS, you will also need to install cmake. You can install brew and run `brew install cmake`.

### Android Build

Follow the steps in https://v2.tauri.app/start/prerequisites/#android. At the time of writing, that means running this after performing all SDK installations in Android Studio (yay -S android-studio on Arch):

```bash
export JAVA_HOME=/opt/android-studio/jbr
export ANDROID_HOME="$HOME/Android/Sdk"
export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"
```

When it says `export NDK_HOME="$ANDROID_HOME/ndk/$(ls -1 $ANDROID_HOME/ndk)"`, run that as-is, then run it with `ANDROID_NDK_HOME` in place of `NDK_HOME`.

Before running `bun run tauri android dev`, run `export BINDGEN_EXTRA_CLANG_ARGS="-target x86_64-linux-android21"` to set the target SDK version. (While we target 21 as the minimum SDK version currently, this may change in the future. If so, this should be updated.)

You also need Java 21, since 25 is too new (`sudo pacman -S jdk21-openjdk`). So run this if JBR in Android Studio shipped with 25 or later:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

### Signing Updates

See https://tauri.app/plugin/updater/.

### Snapcraft

Snapcraft updates should happen automatically. If the token expires, log in to snapcraft and run this command to get a new secret:

```bash
snapcraft export-login --snaps=agent-one --channels=stable -
```

## Updating Dependencies

- `bun update` and `cargo update` to update dependencies (safe)
- `cargo upgrade` to upgrade dependencies to the latest version (unsafe, test for breaking changes)
- `bunx npm-check-updates -u` to update dependencies to the latest version (unsafe, test for breaking changes)
- `bunx actions-up` to update actions in workflows (test manually in a PR)
- `bunx --bun shadcn@latest diff` to check for updates to UI components

## Testing

### With Playwright

- `bunx -y playwright install` to download browsers
- `bunx -y playwright test` to run all tests in all projects
- `bunx -y playwright test --project="chromium-desktop-light" --project="pixel-7-dark"` to run only fast Chromium tests
- Always run `bun run build` before tests if you've made changes to the codebase

## PR Tests

- To run E2E tests on a commit in your PR, add `[e2e]` to the commit message. E2E tests will only run if the _current_ commit message contains `[e2e]`, even previous commit messages also contain `[e2e]`.
- Rust checks will only run if `src-tauri/` has changed.

---

Copyright © 2026 bestcodes.dev

All rights reserved.

This code is proprietary and confidential. No license is granted to use, copy, modify, distribute, or create derivative works of this software except with explicit written permission from the copyright holder.
