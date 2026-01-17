/* eslint-disable @cspell/spellchecker */
import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  globalIgnores(["dist"]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  cspellESLintPluginRecommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@cspell/spellchecker": [
        "warn",
        {
          cspell: {
            words: [
              "keymap",
              "Keymap",
              "shiki",
              "overscan",
              "cmdk",
              "vaul",
              "groq",
              "kimi",
              "Kimi",
              "Groq",
              "moonshotai",
              "openrouter",
              "nemotron",
              "Nemotron",
              "Tauri",
              "modelcontextprotocol",
              "nums",
              "shikijs",
              "GROQ",
              "OPENROUTER",
              "cerebras",
              "Cerebras",
              "Loadables",
              "opencode",
              "OpenCode",
              "OPENCODE",
              "byok",
            ],
          },
        },
      ],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
];
