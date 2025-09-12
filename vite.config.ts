import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, UserConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

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
            manualChunks: {
              react: ["react", "react-dom", "react-dom/client"],
              reactRouter: ["react-router"],
              aiSdk: [
                "ai",
                "@ai-sdk/react",
                "@ai-sdk/google",
                "@ai-sdk/groq",
                "@openrouter/ai-sdk-provider",
              ],
              codemirror: [
                "codemirror",
                "@uiw/react-codemirror",
                "@codemirror/view",
              ],
              codemirrorLangs: ["@codemirror/lang-markdown"],
              markdown: [
                "react-markdown",
                "remark-breaks",
                "remark-gfm",
                "marked",
              ],
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
              ],
              miscUi: ["vaul", "tailwind-merge"],
            },
          },
        },
      },
    }) satisfies UserConfig,
);
