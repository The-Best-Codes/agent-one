import { cn } from "@/lib/utils";
import type { FC } from "react";
import ShikiHighlighter, {
  createHighlighterCore,
  createJavaScriptRegexEngine,
  type ShikiHighlighterProps,
} from "react-shiki/core";

// Themes
import themeDarkPlus from "@shikijs/themes/dark-plus";
import themeLightPlus from "@shikijs/themes/light-plus";

const getHighlighterPromise = await createHighlighterCore({
  langs: [
    () => import("@shikijs/langs/bash"),
    () => import("@shikijs/langs/css"),
    () => import("@shikijs/langs/html"),
    () => import("@shikijs/langs/json"),
    () => import("@shikijs/langs/javascript"),
    () => import("@shikijs/langs/typescript"),
    () => import("@shikijs/langs/tsx"),
  ],
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
