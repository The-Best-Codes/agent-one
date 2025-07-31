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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { highlight } = useSyntaxHighlighter();

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);
    setHighlightedHtml(null);

    highlight(code, language, theme).then((result) => {
      if (cancelled) return;

      setHighlightedHtml(result.html);
      setLoading(result.loading);
      setError(result.error);
    });

    return () => {
      cancelled = true;
    };
  }, [code, language, theme, highlight]);

  const BASE_STYLES =
    "[&_pre]:p-2 [&_pre]:bg-[rgb(30,30,30)] [&_pre]:overflow-x-auto";

  if (loading || !highlightedHtml) {
    return (
      <pre className="bg-[rgb(30,30,30)] text-xs p-2 max-w-full overflow-auto">
        <code className="text-white">{code}</code>
      </pre>
    );
  }

  if (error) {
    logger.error(`Syntax highlighting failed for ${language}:`, error);
    return (
      <pre className="bg-[rgb(30,30,30)] text-xs p-2 max-w-full overflow-auto">
        <code className="text-white">{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(BASE_STYLES, className)}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }} // TODO: Research how react-shiki doesn't use dangerouslySetInnerHTML and use their methods here
      {...props}
    />
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
