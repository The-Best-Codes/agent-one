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
          aiSdk: ["ai", "@ai-sdk/react", "@ai-sdk/google", "@ai-sdk/groq"],
          codemirror: [
            "codemirror",
            "@uiw/react-codemirror",
            "@codemirror/view",
          ],
          codemirrorLangs: ["@codemirror/lang-markdown"],
          markdown: ["react-markdown", "remark-breaks", "remark-gfm"],
          shikiCore: ["react-shiki"],
          shikiThemes: [
            "@shikijs/themes/dark-plus",
            "@shikijs/themes/light-plus",
          ],
        },
      },
    },
  },
}));
