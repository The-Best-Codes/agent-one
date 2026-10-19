import { type CSSProperties, type FC, memo, useMemo } from "react";

import useSyntaxHighlighter from "@/hooks/use-syntax-highlighter";
import type { HighlightLine, HighlightTheme } from "@/lib/syntax-highlighter/types";
import { cn } from "@/lib/utils";

const FONT_STYLE_ITALIC = 1;
const FONT_STYLE_BOLD = 2;
const FONT_STYLE_UNDERLINE = 4;
const FONT_STYLE_STRIKETHROUGH = 8;

export type HighlighterProps = {
  code: string;
  language: string;
  theme?: HighlightTheme;
  className?: string;
};

const tokenStyle = (color?: string, fontStyle?: number): CSSProperties | undefined => {
  if (!color && !fontStyle) return undefined;
  const decorations = [
    fontStyle && fontStyle & FONT_STYLE_UNDERLINE ? "underline" : "",
    fontStyle && fontStyle & FONT_STYLE_STRIKETHROUGH ? "line-through" : "",
  ].filter(Boolean);
  return {
    color,
    ...(fontStyle && fontStyle & FONT_STYLE_ITALIC ? { fontStyle: "italic" } : {}),
    ...(fontStyle && fontStyle & FONT_STYLE_BOLD ? { fontWeight: "bold" } : {}),
    ...(decorations.length > 0 ? { textDecoration: decorations.join(" ") } : {}),
  };
};

const CodeLine = memo(
  ({ text, tokens, newline }: { text: string; tokens?: HighlightLine; newline: boolean }) => {
    const matches = tokens !== undefined && tokens.map((token) => token.content).join("") === text;

    return (
      <>
        <span className="line">
          {matches
            ? tokens.map((token, index) => (
                <span key={index} style={tokenStyle(token.color, token.fontStyle)}>
                  {token.content}
                </span>
              ))
            : text}
        </span>
        {newline && "\n"}
      </>
    );
  },
);

CodeLine.displayName = "CodeLine";

export const SyntaxHighlighter: FC<HighlighterProps> = ({
  code,
  language,
  theme = "dark-plus",
  className,
}) => {
  const highlighted = useSyntaxHighlighter(code, language, theme);
  const lines = useMemo(() => code.split("\n"), [code]);

  return (
    <pre
      className={cn(
        "max-w-full overflow-auto bg-[rgb(30,30,30)] p-2 text-sm text-white",
        className,
      )}
      style={highlighted?.fg ? { color: highlighted.fg } : undefined}
    >
      <code>
        {lines.map((text, index) => (
          <CodeLine
            key={index}
            text={text}
            tokens={highlighted?.lines[index]}
            newline={index < lines.length - 1}
          />
        ))}
      </code>
    </pre>
  );
};

SyntaxHighlighter.displayName = "SyntaxHighlighter";
