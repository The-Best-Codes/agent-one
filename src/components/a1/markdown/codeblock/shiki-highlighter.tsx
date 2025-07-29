import { cn } from "@/lib/utils";
import { useEffect, useReducer, useState, type FC } from "react";
import ShikiHighlighter, {
  createHighlighterCore,
  createJavaScriptRegexEngine,
  type ShikiHighlighterProps,
} from "react-shiki/core";
import type { HighlighterCore } from "shiki";
import { shikiLangsMap } from "./shiki-langs";

// Themes
import themeDarkPlus from "@shikijs/themes/dark-plus";
import themeLightPlus from "@shikijs/themes/light-plus";

let highlighterPromise: Promise<HighlighterCore> | null = null;

const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      langs: [],
      themes: [themeDarkPlus, themeLightPlus],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  }
  return highlighterPromise;
};

export type HighlighterProps = Omit<
  ShikiHighlighterProps,
  "children" | "theme" | "highlighter"
> & {
  code: string;
  language: string;
  theme?: "dark-plus" | "light-plus";
};

export const SyntaxHighlighter: FC<HighlighterProps> = ({
  code,
  language,
  theme = "dark-plus",
  className,
  addDefaultStyles = false,
  showLanguage = false,
  ...props
}) => {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null);
  const [updateKey, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    getHighlighter().then(setHighlighter);
  }, []);

  const langAlias = language.toLowerCase();

  useEffect(() => {
    if (!highlighter || !langAlias) {
      return;
    }

    if (highlighter.getLoadedLanguages().includes(langAlias as never)) {
      return;
    }

    const langLoader = shikiLangsMap[langAlias as keyof typeof shikiLangsMap];

    if (langLoader) {
      langLoader()
        .then((langModule) => highlighter.loadLanguage(langModule.default))
        .then(() => {
          forceUpdate();
        })
        .catch((err) => {
          console.error(`Failed to load Shiki language: ${langAlias}`, err);
        });
    }
  }, [highlighter, langAlias]);

  const BASE_STYLES =
    "[&_pre]:p-2 [&_pre]:bg-[rgb(30,30,30)] [&_pre]:overflow-x-auto";

  if (!highlighter) {
    return (
      <pre className="bg-[rgb(30,30,30)] text-xs p-2 max-w-full overflow-auto">
        <code className="text-white">{code}</code>
      </pre>
    );
  }

  return (
    <ShikiHighlighter
      {...props}
      highlighter={highlighter}
      language={language}
      theme={theme}
      addDefaultStyles={addDefaultStyles}
      showLanguage={showLanguage}
      className={cn(BASE_STYLES, className)}
      key={updateKey}
    >
      {code}
    </ShikiHighlighter>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
