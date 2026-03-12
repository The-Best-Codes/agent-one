import path from "path";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

const vendorManualChunks = {
  react: ["react", "react-dom", "react-dom/client"],
  reactRouter: ["react-router"],
  aiMain: ["ai", "@ai-sdk/react", "@ai-sdk/mcp", "@ai-sdk/provider", "@ai-sdk/provider-utils"],
  aiSdkProviders: [
    "@ai-sdk/anthropic",
    "@ai-sdk/cohere",
    "@ai-sdk/deepinfra",
    "@ai-sdk/deepseek",
    "@ai-sdk/fireworks",
    "@ai-sdk/google",
    "@ai-sdk/groq",
    "@ai-sdk/mistral",
    "@ai-sdk/openai",
    "@ai-sdk/openai-compatible",
    "@ai-sdk/perplexity",
    "@ai-sdk/togetherai",
    "@ai-sdk/xai",
    "@openrouter/ai-sdk-provider",
  ],
  codemirrorCore: [
    "codemirror",
    "@codemirror/view",
    "@codemirror/state",
    "@codemirror/language",
    "@codemirror/commands",
  ],
  codemirrorReact: ["@uiw/react-codemirror"],
  codemirrorLangs: ["@codemirror/lang-markdown"],
  markdown: ["react-markdown", "remark-breaks", "remark-gfm", "marked"],
  radixUi: [
    "radix-ui",
    // cmdk has to go in the Radix chunk or you get import errors in prod
    "cmdk",
  ],
  miscUi: [
    "vaul",
    "tailwind-merge",
    "sonner",
    "class-variance-authority",
    "clsx",
    "fast-equals",
    "lucide-react",
    "react-hotkeys-hook",
    "lodash.debounce",
    "dedent",
    "remend",
  ],
  tauri: [
    "@tauri-apps/api",
    "@tauri-apps/plugin-clipboard-manager",
    "@tauri-apps/plugin-deep-link",
    "@tauri-apps/plugin-dialog",
    "@tauri-apps/plugin-fs",
    "@tauri-apps/plugin-http",
    "@tauri-apps/plugin-log",
    "@tauri-apps/plugin-notification",
    "@tauri-apps/plugin-opener",
    "@tauri-apps/plugin-os",
    "@tauri-apps/plugin-process",
    "@tauri-apps/plugin-shell",
    "@tauri-apps/plugin-sql",
    "@tauri-apps/plugin-updater",
    "@tauri-apps/plugin-websocket",
    "@tauri-apps/plugin-window-state",
  ],
  auth: ["better-auth", "@better-auth/core", "@better-fetch/fetch", "nanostores", "defu"],
  stateAndVirtualization: ["jotai", "consola", "@tanstack/virtual-core", "@tanstack/react-virtual"],
};

export default defineConfig(
  () =>
    ({
      plugins: [
        react(),
        babel({
          presets: [reactCompilerPreset({ target: "19" })],
        }),
        tailwindcss(),
        visualizer({
          open: false,
          emitFile: false,
          filename: "dist/stats.html",
        }),
      ],

      test: {
        globals: true,
        environment: "jsdom",
        include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        exclude: ["tests/e2e/**"],
      },

      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },

      clearScreen: false,
      server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
          ? {
              protocol: "ws",
              host,
              port: 1421,
            }
          : undefined,
        watch: {
          ignored: ["**/src-tauri/**", "**/tests/**"],
        },
      },

      worker: {
        format: "es",
      },

      build: {
        rolldownOptions: {
          output: {
            manualChunks(id: string) {
              // Normalize to POSIX-style paths so checks work on Windows too
              const normalizedId = id.replace(/\\/g, "/");
              const modelListsDir = path
                .resolve(__dirname, "src/assets/model-lists")
                .replace(/\\/g, "/");
              const mcpRegistryDir = path
                .resolve(__dirname, "src/assets/mcp-registry")
                .replace(/\\/g, "/");

              if (normalizedId.includes(`${modelListsDir}/`)) {
                return path.parse(id).name;
              }

              if (normalizedId.includes(`${mcpRegistryDir}/`)) {
                return "mcpRegistry";
              }

              if (normalizedId.includes("/node_modules/")) {
                for (const [chunkName, packages] of Object.entries(vendorManualChunks)) {
                  if (packages.some((pkg) => normalizedId.includes(`/node_modules/${pkg}/`))) {
                    return chunkName;
                  }
                }
              }
            },
          },
        },
      },
    }),
);
