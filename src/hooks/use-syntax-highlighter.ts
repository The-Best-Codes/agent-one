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

  return { highlight };
};

export default useSyntaxHighlighter;
