import useSyntaxHighlighter from "@/hooks/use-syntax-highlighter";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useEffect, useState, type FC } from "react";

const logger = getLogger(import.meta.url);

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
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { highlight } = useSyntaxHighlighter();

  useEffect(() => {
    let cancelled = false;
    setError(null);

    highlight(code, language, theme).then((result) => {
      if (cancelled) return;

      if (result.html) {
        setHighlightedHtml(result.html);
      }

      if (result.error) {
        setError(result.error);
        logger.error(
          `Syntax highlighting failed for ${language}:`,
          result.error,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language, theme, highlight]);

  const BASE_STYLES =
    "[&_pre]:p-2 [&_pre]:bg-[rgb(30,30,30)] [&_pre]:overflow-x-auto";

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
    <pre className="max-w-full overflow-auto bg-[rgb(30,30,30)] p-2 text-xs">
      <code className="text-white">{code}</code>
    </pre>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
