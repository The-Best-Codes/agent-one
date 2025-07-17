// TODO: Use globalThis to cache the instance?
/*
const globalRef = globalThis as unknown as {
  __shikiHighlighter?: ReturnType<typeof createHighlighterCore>;
};
*/

import type { CodeToHtmlOptions } from "@llm-ui/code";
import {
  allLangs,
  allLangsAlias,
  loadHighlighter,
  useCodeBlockToHtml,
} from "@llm-ui/code";
import { type LLMOutputComponent } from "@llm-ui/react";
import parseHtml from "html-react-parser";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine-oniguruma.mjs";
import { bundledLanguagesInfo } from "shiki/langs";
import { bundledThemes } from "shiki/themes";
import wasm from "shiki/wasm";

const highlighter = loadHighlighter(
  createHighlighterCore({
    langs: allLangs(bundledLanguagesInfo),
    langAlias: allLangsAlias(bundledLanguagesInfo),
    themes: Object.values(bundledThemes),
    engine: createOnigurumaEngine(wasm),
  }),
);

const codeToHtmlOptions: CodeToHtmlOptions = {
  theme: "github-dark",
};

export const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  });
  if (!html) {
    return (
      <pre className="shiki">
        <code>{code}</code>
      </pre>
    );
  }
  return <>{parseHtml(html)}</>;
};
