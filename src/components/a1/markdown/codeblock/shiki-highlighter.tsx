import { type FC, useEffect, useRef, useState } from "react";

import useSyntaxHighlighter from "@/hooks/use-syntax-highlighter";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

const logger = getLogger(import.meta.url);

const HIGHLIGHT_THROTTLE_MS = 100;

export type HighlighterProps = {
  code: string;
  language: string;
  theme?: "dark-plus" | "light-plus";
  className?: string;
};

export const SyntaxHighlighter: FC<HighlighterProps> = ({
  code,
  language,
  theme = "dark-plus",
  className,
  ...props
}) => {
  const { highlight, getCachedHighlight, forgetHighlight } = useSyntaxHighlighter();
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(() =>
    getCachedHighlight(code, language, theme),
  );
  const [error, setError] = useState<string | null>(null);
  const lastRequestAtRef = useRef(0);
  const previousCodeRef = useRef(code);

  useEffect(() => {
    if (previousCodeRef.current !== code) {
      forgetHighlight(previousCodeRef.current, language, theme);
      previousCodeRef.current = code;
    }

    let cancelled = false;
    const delay = Math.max(0, lastRequestAtRef.current + HIGHLIGHT_THROTTLE_MS - Date.now());

    const timeoutId = setTimeout(() => {
      lastRequestAtRef.current = Date.now();
      void highlight(code, language, theme).then((result) => {
        if (cancelled) {
          if (previousCodeRef.current !== code) {
            forgetHighlight(code, language, theme);
          }
          return;
        }

        setError(null);

        if (result.html) {
          setHighlightedHtml(result.html);
        }

        if (result.error) {
          setError(result.error);
          logger.error(`Syntax highlighting failed for ${language}:`, result.error);
        }
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [code, language, theme, highlight, forgetHighlight]);

  const BASE_STYLES =
    "[&_pre]:p-2 [&_pre]:bg-[rgb(30,30,30)] [&_pre]:overflow-x-auto [&_pre]:text-sm";

  if (highlightedHtml && !error) {
    return (
      <div
        className={cn(BASE_STYLES, className)}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        {...props}
      />
    );
  }

  return (
    <pre className="max-w-full overflow-auto bg-[rgb(30,30,30)] p-2 text-sm">
      <code className="text-white">{code}</code>
    </pre>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
