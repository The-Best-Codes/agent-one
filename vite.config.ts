import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
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
      ignored: ["**/src-tauri/**"],
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-dom/client"],
          codemirror: ["codemirror", "@uiw/react-codemirror"],
          codemirrorLangs: [
            "@codemirror/lang-rust",
            "@codemirror/lang-cpp",
            "@codemirror/lang-java",
            "@codemirror/lang-json",
            "@codemirror/lang-php",
            "@codemirror/lang-go",
            "@codemirror/lang-python",
            "@codemirror/lang-css",
            "@codemirror/lang-markdown",
            "@codemirror/lang-javascript",
            "@codemirror/lang-html",
            "@codemirror/language-data",
          ],
          lezer1: [
            "@lezer/css",
            "@lezer/html",
            "@lezer/go",
            "@lezer/java",
            "@lezer/python",
          ],
          lezer2: [
            "@lezer/rust",
            "@lezer/javascript",
            "@lezer/markdown",
            "@lezer/php",
            "@lezer/cpp",
          ],
          aiSdk: [
            "ai",
            "@ai-sdk/gateway",
            "@ai-sdk/react",
            "@ai-sdk/provider",
            "@ai-sdk/provider-utils",
            "@ai-sdk/ui-utils",
            "@ai-sdk/google",
          ],
        },
      },
    },
  },
}));
