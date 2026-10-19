import themeDarkPlus from "@shikijs/themes/dark-plus";
import themeLightPlus from "@shikijs/themes/light-plus";
import {
  createHighlighterCore,
  type GrammarState,
  type HighlighterCore,
  type ThemedToken,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

import { getLogger } from "../lib/logger";
import type {
  HighlightLine,
  HighlightRequest,
  HighlightResponse,
  HighlightTheme,
  WorkerRequest,
} from "../lib/syntax-highlighter/types";

let highlighter: HighlighterCore | null = null;

const logger = getLogger(import.meta.url);

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
    logger.error("Failed to initialize highlighter:", error);
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
    throw new Error(`Failed to load language ${lang}: ${String(error)}`, {
      cause: error,
    });
  }
}

type HighlightSession = {
  language: string;
  theme: HighlightTheme;
  source: string;
  lineCount: number;
  grammarState: GrammarState | undefined;
};

const sessions = new Map<string, HighlightSession>();

const toLine = (tokens: ThemedToken[]): HighlightLine =>
  tokens.map(({ content, color, fontStyle }) => ({
    content,
    color,
    ...(fontStyle ? { fontStyle } : {}),
  }));

async function highlightCode(request: HighlightRequest): Promise<HighlightResponse> {
  if (!highlighter) {
    throw new Error("Highlighter not initialized");
  }

  const { id, sessionId, code, theme } = request;
  const normalizedLang = request.language.toLowerCase();
  const resolvedLang = langAliases[normalizedLang] || normalizedLang;

  try {
    await loadLanguage(resolvedLang);

    let session = sessions.get(sessionId);
    if (
      !session ||
      request.reset ||
      session.language !== resolvedLang ||
      session.theme !== theme ||
      !code.startsWith(session.source)
    ) {
      session = {
        language: resolvedLang,
        theme,
        source: "",
        lineCount: 0,
        grammarState: undefined,
      };
      sessions.set(sessionId, session);
    }

    const startLine = session.lineCount;
    const rest = code.slice(session.source.length);
    const lastNewline = rest.lastIndexOf("\n");
    const lines: HighlightLine[] = [];
    let fg: string | undefined;

    if (lastNewline !== -1) {
      const complete = rest.slice(0, lastNewline);
      const result = highlighter.codeToTokens(complete, {
        lang: resolvedLang,
        theme,
        grammarState: session.grammarState,
      });
      const lineTexts = complete.split("\n");
      for (let i = 0; i < lineTexts.length; i++) {
        lines.push(result.tokens[i] ? toLine(result.tokens[i]) : [{ content: lineTexts[i] }]);
      }
      fg = result.fg;
      session.grammarState =
        result.grammarState ??
        highlighter.getLastGrammarState(complete, {
          lang: resolvedLang,
          theme,
          grammarState: session.grammarState,
        });
      session.source += rest.slice(0, lastNewline + 1);
      session.lineCount += lineTexts.length;
    }

    const tail = code.slice(session.source.length);
    let partial: HighlightLine | null = null;
    if (tail) {
      const result = highlighter.codeToTokens(tail, {
        lang: resolvedLang,
        theme,
        grammarState: session.grammarState,
      });
      partial = toLine(result.tokens[0] ?? []);
      fg ??= result.fg;
    }

    return { id, startLine, lines, partial, fg };
  } catch (error) {
    sessions.delete(sessionId);
    throw new Error(`Failed to highlight code: ${String(error)}`, {
      cause: error,
    });
  }
}

let queue: Promise<void> = Promise.resolve();

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.type === "init") {
    initializeHighlighter().catch(logger.error);
    return;
  }

  queue = queue.then(async () => {
    if (request.type === "dispose") {
      sessions.delete(request.sessionId);
      return;
    }

    try {
      await initializeHighlighter();
      self.postMessage(await highlightCode(request));
    } catch (error) {
      const response: HighlightResponse = {
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      };
      self.postMessage(response);
    }
  });
};
