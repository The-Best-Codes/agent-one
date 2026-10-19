import { useEffect, useId, useMemo, useRef, useState } from "react";

import { getLogger } from "@/lib/logger";
import type { HighlightTheme } from "@/lib/syntax-highlighter/types";
import { type HighlightedCode, highlighterClient } from "@/lib/syntax-highlighter/worker-client";

const logger = getLogger(import.meta.url);

const HIGHLIGHT_THROTTLE_MS = 100;

const useSyntaxHighlighter = (
  code: string,
  language: string,
  theme: HighlightTheme = "dark-plus",
): HighlightedCode | null => {
  const sessionId = useId();
  const [highlighted, setHighlighted] = useState<HighlightedCode | null>(null);
  const cached = useMemo(
    () => highlighterClient.peekCached(code, language, theme),
    [code, language, theme],
  );
  const lastRequestAtRef = useRef(0);

  useEffect(() => {
    return () => highlighterClient.dispose(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (highlighterClient.getCached(code, language, theme)) {
      return;
    }

    let cancelled = false;
    const delay = Math.max(0, lastRequestAtRef.current + HIGHLIGHT_THROTTLE_MS - Date.now());

    const timeoutId = setTimeout(() => {
      lastRequestAtRef.current = Date.now();
      void highlighterClient.highlight(sessionId, code, language, theme).then((result) => {
        if (result.error) {
          logger.error(`Syntax highlighting failed for ${language}:`, result.error);
        }
        if (!cancelled) {
          setHighlighted(result.highlighted);
        }
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [sessionId, code, language, theme]);

  return cached ?? highlighted;
};

export default useSyntaxHighlighter;
