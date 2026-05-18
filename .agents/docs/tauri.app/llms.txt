# Tauri Full Documentation

> Tauri is a framework for building tiny, fast binaries for all major desktop and mobile platforms. Developers can integrate any frontend framework that compiles to HTML, JavaScript, and CSS for building their user experience while leveraging languages such as Rust, Swift, and Kotlin for backend logic when needed.

This index links to documentation that covers everything from getting started to advanced concepts, and distribution of Tauri applications.

The index is organized into key sections:
- **start**: Information for getting up and running with Tauri, including prerequisites and installation instructions
- **core concepts**: Topics that you should get more intimately familiar with if you want to get the most out of the framework.
- **security**: High-level concepts and security features at the core of Tauri's design and ecosystem that make you, your applications and your users more secure by default
- **develop**: Topics pertaining to the development of Tauri applications, including how to use the Tauri API, communicating between the frontend and backend, configuration, state management, debugging and more.
- **distribute**: Information on the tooling you need to distribute your application either to the platform app stores or as platform-specific installers.
- **learn**: Tutorials intended to provided end-to-end learning experiences to guide you through specific Tauri topics and help you apply knowledge from the guides and reference documentation.
- **plugins**: Information on the extensibility of Tauri from Built-in Tauri features and functionality to provided plugins and recipes built by the Tauri community
- **about**: Various information about Tauri from governance, philosophy, and trademark guidelines.

Each section contains links to detailed markdown files that provide comprehensive information about Tauri's features and how to use them effectively.

**Table of Contents**

## Start
- [What is Tauri?](https://v2.tauri.app/start)
- [Create a Project](https://v2.tauri.app/start/create-project)
- [Frontend Configuration](https://v2.tauri.app/start/frontend)
- [Leptos](https://v2.tauri.app/start/frontend/leptos)
- [Next.js](https://v2.tauri.app/start/frontend/nextjs)
- [Nuxt](https://v2.tauri.app/start/frontend/nuxt)
- [Qwik](https://v2.tauri.app/start/frontend/qwik)
- [SvelteKit](https://v2.tauri.app/start/frontend/sveltekit)
- [Trunk](https://v2.tauri.app/start/frontend/trunk)
- [Vite](https://v2.tauri.app/start/frontend/vite)
- [Upgrade & Migrate](https://v2.tauri.app/start/migrate)
- [Upgrade from Tauri 1.0](https://v2.tauri.app/start/migrate/from-tauri-1)
- [Upgrade from Tauri 2.0 Beta](https://v2.tauri.app/start/migrate/from-tauri-2-beta)
- [Prerequisites](https://v2.tauri.app/start/prerequisites)
- [Project Structure](https://v2.tauri.app/start/project-structure)

## Concept
- [Core Concepts](https://v2.tauri.app/concept)
- [Tauri Architecture](https://v2.tauri.app/concept/architecture)
- [Inter-Process Communication](https://v2.tauri.app/concept/inter-process-communication)
- [Brownfield Pattern](https://v2.tauri.app/concept/inter-process-communication/brownfield)
- [Isolation Pattern](https://v2.tauri.app/concept/inter-process-communication/isolation)
- [Process Model](https://v2.tauri.app/concept/process-model)
- [App Size](https://v2.tauri.app/concept/size)

## Security
- [Security](https://v2.tauri.app/security)
- [Asset protocol scope](https://v2.tauri.app/security/asset-protocol): Configure app.security.assetProtocol so the WebView can load local files safely, including FsScope, requireLiteralLeadingDot, and dynamic paths.
- [Capabilities](https://v2.tauri.app/security/capabilities)
- [Content Security Policy (CSP)](https://v2.tauri.app/security/csp)
- [Tauri Ecosystem Security](https://v2.tauri.app/security/ecosystem)
- [Future Work](https://v2.tauri.app/security/future)
- [HTTP Headers](https://v2.tauri.app/security/http-headers)
- [Application Lifecycle Threats](https://v2.tauri.app/security/lifecycle)
- [Permissions](https://v2.tauri.app/security/permissions)
- [Runtime Authority](https://v2.tauri.app/security/runtime-authority)
- [Command Scopes](https://v2.tauri.app/security/scope)

## Develop
- [Develop](https://v2.tauri.app/develop): Core concepts for developing with Tauri.
- [Calling the Frontend from Rust](https://v2.tauri.app/develop/_sections/frontend-listen)
- [Calling the Frontend from Rust](https://v2.tauri.app/develop/calling-frontend)
- [Calling Rust from the Frontend](https://v2.tauri.app/develop/calling-rust)
- [Configuration Files](https://v2.tauri.app/develop/configuration-files)
- [Debug](https://v2.tauri.app/develop/debug)
- [CrabNebula DevTools](https://v2.tauri.app/develop/debug/crabnebula-devtools)
- [Debug in Neovim](https://v2.tauri.app/develop/debug/neovim)
- [Debug in JetBrains IDEs](https://v2.tauri.app/develop/debug/rustrover)
- [Debug in VS Code](https://v2.tauri.app/develop/debug/vscode)
- [App Icons](https://v2.tauri.app/develop/icons)
- [Plugin Development](https://v2.tauri.app/develop/plugins)
- [Mobile Plugin Development](https://v2.tauri.app/develop/plugins/develop-mobile)
- [Embedding Additional Files](https://v2.tauri.app/develop/resources)
- [Embedding External Binaries](https://v2.tauri.app/develop/sidecar)
- [State Management](https://v2.tauri.app/develop/state-management)
- [Tests](https://v2.tauri.app/develop/tests): Techniques for testing inside and outside the Tauri runtime
- [Mock Tauri APIs](https://v2.tauri.app/develop/tests/mocking)
- [WebDriver](https://v2.tauri.app/develop/tests/webdriver): WebDriver Testing
- [Continuous Integration](https://v2.tauri.app/develop/tests/webdriver/ci): WebDriver Testing
- [Selenium](https://v2.tauri.app/develop/tests/webdriver/example/selenium)
- [WebdriverIO](https://v2.tauri.app/develop/tests/webdriver/example/webdriverio)
- [Updating Dependencies](https://v2.tauri.app/develop/updating-dependencies)

## Distribute
- [Distribute](https://v2.tauri.app/distribute)
- [App Store](https://v2.tauri.app/distribute/app-store)
- [AppImage](https://v2.tauri.app/distribute/appimage)
- [AUR](https://v2.tauri.app/distribute/aur)
- [Distributing with CrabNebula Cloud](https://v2.tauri.app/distribute/crabnebula-cloud)
- [Debian](https://v2.tauri.app/distribute/debian)
- [DMG](https://v2.tauri.app/distribute/dmg)
- [Flathub](https://v2.tauri.app/distribute/flatpak)
- [Google Play](https://v2.tauri.app/distribute/google-play)
- [macOS Application Bundle](https://v2.tauri.app/distribute/macos-application-bundle)
- [Microsoft Store](https://v2.tauri.app/distribute/microsoft-store)
- [CrabNebula Cloud](https://v2.tauri.app/distribute/pipelines/crabnebula-cloud)
- [GitHub](https://v2.tauri.app/distribute/pipelines/github)
- [RPM](https://v2.tauri.app/distribute/rpm)
- [Android Code Signing](https://v2.tauri.app/distribute/sign/android)
- [iOS Code Signing](https://v2.tauri.app/distribute/sign/ios)
- [Linux Code Signing](https://v2.tauri.app/distribute/sign/linux)
- [macOS Code Signing](https://v2.tauri.app/distribute/sign/macos)
- [Windows Code Signing](https://v2.tauri.app/distribute/sign/windows)
- [Snapcraft](https://v2.tauri.app/distribute/snapcraft)
- [Windows Installer](https://v2.tauri.app/distribute/windows-installer)

## Learn
- [Learn](https://v2.tauri.app/learn)
- [File Associations on Mobile](https://v2.tauri.app/learn/mobile-file-associations)
- [Multi-Window on Mobile](https://v2.tauri.app/learn/mobile-multiwindow)
- [Capabilities for Different Windows and Platforms](https://v2.tauri.app/learn/security/capabilities-for-windows-and-platforms)
- [Using Plugin Permissions](https://v2.tauri.app/learn/security/using-plugin-permissions)
- [Writing Plugin Permissions](https://v2.tauri.app/learn/security/writing-plugin-permissions)
- [Node.js as a sidecar](https://v2.tauri.app/learn/sidecar-nodejs)
- [Splashscreen](https://v2.tauri.app/learn/splashscreen)
- [System Tray](https://v2.tauri.app/learn/system-tray)
- [Window Customization](https://v2.tauri.app/learn/window-customization)
- [Window Menu](https://v2.tauri.app/learn/window-menu)
