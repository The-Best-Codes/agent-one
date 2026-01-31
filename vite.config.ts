import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, ViteUserConfig } from "vitest/config";

const host = process.env.TAURI_DEV_HOST;

const vendorManualChunks = {
  react: ["react", "react-dom", "react-dom/client"],
  reactRouter: ["react-router"],
  aiMain: ["ai", "@ai-sdk/react", "@ai-sdk/mcp"],
  aiSdk: [
    "@ai-sdk/google",
    "@ai-sdk/groq",
    "@openrouter/ai-sdk-provider",
    "@ai-sdk/openai-compatible",
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
    "@radix-ui/react-toggle-group",
    "@radix-ui/react-roving-focus",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-popper",
    "@radix-ui/react-popover",
    "@radix-ui/react-tooltip",
    "@radix-ui/react-slider",
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-switch",
    "@radix-ui/react-menu",
    "@radix-ui/react-select",
    "@radix-ui/react-primitive",
    "@radix-ui/react-use-controllable-state",
    "@radix-ui/react-collection",
    "@radix-ui/react-slot",
    "@radix-ui/react-direction",
    "@radix-ui/react-visually-hidden",
    "@radix-ui/react-accordion",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-dialog",
    "@radix-ui/react-label",
    "@radix-ui/react-progress",
    "@radix-ui/react-separator",
    "@radix-ui/react-tabs",
    "@radix-ui/react-toggle",
    // cmdk has to go in the Radix chunk or you get import errors in prod
    "cmdk",
  ],
  miscUi: ["vaul", "tailwind-merge", "sonner"],
};

export default defineConfig(
  async () =>
    ({
      plugins: [
        react({
          babel: {
            plugins: [["babel-plugin-react-compiler", { target: "19" }]],
          },
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
          ignored: ["**/src-tauri/**", "**/docker/**", "**/tests/**"],
        },
      },

      worker: {
        format: "es",
      },

      build: {
        rollupOptions: {
          output: {
            manualChunks(id: string) {
              // Normalize to POSIX-style paths so checks work on Windows too
              const normalizedId = id.replace(/\\/g, "/");
              const modelListsDir = path
                .resolve(__dirname, "src/assets/model-lists")
                .replace(/\\/g, "/");

              if (normalizedId.includes(`${modelListsDir}/`)) {
                return path.parse(id).name;
              }

              if (normalizedId.includes("/node_modules/")) {
                for (const [chunkName, packages] of Object.entries(
                  vendorManualChunks,
                )) {
                  if (
                    packages.some((pkg) =>
                      normalizedId.includes(`/node_modules/${pkg}/`),
                    )
                  ) {
                    return chunkName;
                  }
                }
              }
            },
          },
        },
      },
    }) satisfies ViteUserConfig,
);
