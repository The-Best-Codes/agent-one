import { cn } from "@/lib/utils";
import type { FC } from "react";
import ShikiHighlighter, {
  createHighlighterCore,
  createJavaScriptRegexEngine,
  type ShikiHighlighterProps,
} from "react-shiki/core";

// Languages
import langBash from "@shikijs/langs/bash";
import langCss from "@shikijs/langs/css";
import langHtml from "@shikijs/langs/html";
import langJs from "@shikijs/langs/javascript";
import langJson from "@shikijs/langs/json";
import langTsx from "@shikijs/langs/tsx";
import langTs from "@shikijs/langs/typescript";

// Themes
import themeDarkPlus from "@shikijs/themes/dark-plus";
import themeLightPlus from "@shikijs/themes/light-plus";

const getHighlighterPromise = await createHighlighterCore({
  langs: [langBash, langCss, langHtml, langJson, langJs, langTs, langTsx],
  themes: [themeDarkPlus, themeLightPlus],
  engine: createJavaScriptRegexEngine({ forgiving: true }),
});

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
  const BASE_STYLES = "[&_pre]:p-2";

  return (
    <ShikiHighlighter
      {...props}
      highlighter={getHighlighterPromise}
      language={language}
      theme={theme}
      addDefaultStyles={addDefaultStyles}
      showLanguage={showLanguage}
      className={cn(BASE_STYLES, className)}
    >
      {code}
    </ShikiHighlighter>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
