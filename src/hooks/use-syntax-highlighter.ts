import { useCallback } from "react";

import { highlighterClient } from "@/lib/syntax-highlighter/worker-client";

export interface HighlightResult {
  html: string | null;
  error: string | null;
}

const useSyntaxHighlighter = () => {
  const highlight = useCallback(
    (
      code: string,
      language: string,
      theme: "dark-plus" | "light-plus" = "dark-plus",
    ): Promise<HighlightResult> => {
      return highlighterClient.highlight(code, language, theme);
    },
    [],
  );

  const getCachedHighlight = useCallback(
    (code: string, language: string, theme: "dark-plus" | "light-plus" = "dark-plus") =>
      highlighterClient.getCached(code, language, theme) ?? null,
    [],
  );

  const forgetHighlight = useCallback(
    (code: string, language: string, theme: "dark-plus" | "light-plus" = "dark-plus") => {
      highlighterClient.forget(code, language, theme);
    },
    [],
  );

  return { highlight, getCachedHighlight, forgetHighlight };
};

export default useSyntaxHighlighter;
