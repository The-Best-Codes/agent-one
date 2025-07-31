import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Themes
import themeDarkPlus from "@shikijs/themes/dark-plus";
import themeLightPlus from "@shikijs/themes/light-plus";

let highlighter: HighlighterCore | null = null;

const shikiLangsMap = {
  html: () => import("@shikijs/langs/html"),
  css: () => import("@shikijs/langs/css"),
  scss: () => import("@shikijs/langs/scss"),
  javascript: () => import("@shikijs/langs/javascript"),
  typescript: () => import("@shikijs/langs/typescript"),
  jsx: () => import("@shikijs/langs/jsx"),
  tsx: () => import("@shikijs/langs/tsx"),
  vue: () => import("@shikijs/langs/vue"),
  svelte: () => import("@shikijs/langs/svelte"),
  python: () => import("@shikijs/langs/python"),
  java: () => import("@shikijs/langs/java"),
  csharp: () => import("@shikijs/langs/csharp"),
  php: () => import("@shikijs/langs/php"),
  go: () => import("@shikijs/langs/go"),
  swift: () => import("@shikijs/langs/swift"),
  kotlin: () => import("@shikijs/langs/kotlin"),
  rust: () => import("@shikijs/langs/rust"),
  sql: () => import("@shikijs/langs/sql"),
  graphql: () => import("@shikijs/langs/graphql"),
  json: () => import("@shikijs/langs/json"),
  yaml: () => import("@shikijs/langs/yaml"),
  xml: () => import("@shikijs/langs/xml"),
  toml: () => import("@shikijs/langs/toml"),
  bash: () => import("@shikijs/langs/bash"),
  powershell: () => import("@shikijs/langs/powershell"),
  dockerfile: () => import("@shikijs/langs/dockerfile"),
  markdown: () => import("@shikijs/langs/markdown"),
  diff: () => import("@shikijs/langs/diff"),
};

// Language aliases
const langAliases: Record<string, keyof typeof shikiLangsMap> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  shell: "bash",
  sh: "bash",
  ps1: "powershell",
  md: "markdown",
  mdx: "markdown",
  yml: "yaml",
  rs: "rust",
};

interface HighlightRequest {
  id: string;
  code: string;
  language: string;
  theme: "dark-plus" | "light-plus";
}

interface HighlightResponse {
  id: string;
  html?: string;
  error?: string;
}

async function initializeHighlighter() {
  if (highlighter) return highlighter;

  try {
    highlighter = await createHighlighterCore({
      langs: [],
      themes: [themeDarkPlus, themeLightPlus],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
    return highlighter;
  } catch (error) {
    console.error("Failed to initialize highlighter:", error);
    throw error;
  }
}

async function loadLanguage(lang: string) {
  if (!highlighter) {
    throw new Error("Highlighter not initialized");
  }

  const normalizedLang = lang.toLowerCase();
  const resolvedLang = langAliases[normalizedLang] || normalizedLang;

  if (highlighter.getLoadedLanguages().includes(resolvedLang as never)) {
    return;
  }

  const langLoader = shikiLangsMap[resolvedLang as keyof typeof shikiLangsMap];
  if (!langLoader) {
    throw new Error(`Unsupported language: ${lang}`);
  }

  try {
    const langModule = await langLoader();
    await highlighter.loadLanguage(langModule.default);
  } catch (error) {
    throw new Error(`Failed to load language ${lang}: ${error}`);
  }
}

async function highlightCode(
  code: string,
  language: string,
  theme: "dark-plus" | "light-plus",
) {
  if (!highlighter) {
    throw new Error("Highlighter not initialized");
  }

  const normalizedLang = language.toLowerCase();
  const resolvedLang = langAliases[normalizedLang] || normalizedLang;

  try {
    await loadLanguage(resolvedLang);

    const html = highlighter.codeToHtml(code, {
      lang: resolvedLang,
      theme,
    });

    return html;
  } catch (error) {
    throw new Error(`Failed to highlight code: ${error}`);
  }
}

self.onmessage = async (event: MessageEvent<HighlightRequest>) => {
  const { id, code, language, theme } = event.data;

  try {
    await initializeHighlighter();

    const html = await highlightCode(code, language, theme);

    const response: HighlightResponse = { id, html };
    self.postMessage(response);
  } catch (error) {
    const response: HighlightResponse = {
      id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};

self.addEventListener("message", (event) => {
  if (event.data.type === "init") {
    initializeHighlighter().catch(console.error);
  }
});
