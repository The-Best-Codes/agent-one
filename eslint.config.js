/* eslint-disable @cspell/spellchecker */
import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Ensure we always return an array of config objects,
 * flattening away any nested arrays that plugins export.
 */
const safeFlatten = (item) => {
  if (!item) return [];
  if (Array.isArray(item)) return item.flat(Infinity);
  return [item];
};

export default [
  ...safeFlatten(globalIgnores(["dist"])),
  ...safeFlatten(js.configs.recommended),
  ...safeFlatten(tseslint.configs.recommended),
  ...safeFlatten(reactHooks.configs["recommended-latest"]),
  ...safeFlatten(reactRefresh.configs.vite),
  ...safeFlatten(cspellESLintPluginRecommended),
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
