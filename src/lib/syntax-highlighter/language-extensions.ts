import type { Extension } from "@codemirror/state";

type LanguageLoader = () => Promise<Extension>;

const languageLoaders: Record<string, LanguageLoader> = {
  javascript: () => import("@codemirror/lang-javascript").then((m) => m.javascript()),
  jsx: () => import("@codemirror/lang-javascript").then((m) => m.javascript({ jsx: true })),
  typescript: () =>
    import("@codemirror/lang-javascript").then((m) => m.javascript({ typescript: true })),
  tsx: () =>
    import("@codemirror/lang-javascript").then((m) =>
      m.javascript({ typescript: true, jsx: true }),
    ),
  css: () => import("@codemirror/lang-css").then((m) => m.css()),
  html: () => import("@codemirror/lang-html").then((m) => m.html()),
  markdown: () =>
    import("@codemirror/lang-markdown").then((m) => m.markdown({ base: m.markdownLanguage })),
};

const fileExtensionToLanguage: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "jsx",
  ts: "typescript",
  mts: "typescript",
  cts: "typescript",
  tsx: "tsx",
  css: "css",
  scss: "css",
  less: "css",
  html: "html",
  htm: "html",
  svg: "html",
  xml: "html",
  md: "markdown",
  mdx: "markdown",
  markdown: "markdown",
};

export async function getLanguageExtension(filePath: string): Promise<Extension | null> {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  const lang = fileExtensionToLanguage[ext];
  if (!lang) return null;

  const loader = languageLoaders[lang];
  if (!loader) return null;

  return loader();
}
