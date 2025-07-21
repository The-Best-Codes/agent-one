import { cn } from "@/lib/utils";
import type { FC } from "react";
import ShikiHighlighter, { type ShikiHighlighterProps } from "react-shiki";

export type HighlighterProps = Omit<
  ShikiHighlighterProps,
  "children" | "theme"
> & {
  code: string;
  language: string;
  theme?: ShikiHighlighterProps["theme"];
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
  const BASE_STYLES =
    "[&_pre]:overflow-x-auto [&_pre]:rounded-b-lg [&_pre]:bg-black [&_pre]:p-4 [&_pre]:text-white";

  return (
    <ShikiHighlighter
      {...props}
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
