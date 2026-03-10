import type { UIMessage } from "ai";
import { useAtomValue } from "jotai";
import { PlayIcon, SquareIcon } from "lucide-react";

import { CopyButton } from "@/components/a1/copy-button";
import { Button } from "@/components/ui/button";
import { maxCodeblockCharsAtom } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

import { usePreview } from "./preview";
import { SyntaxHighlighter } from "./shiki-highlighter";

type CodeBlockProps = {
  content: string;
  lang?: string;
  messageRole?: UIMessage["role"];
};

const BestHighlighter = ({
  content,
  lang,
  maxChars,
}: {
  content: string;
  lang?: string;
  maxChars: number;
}) => {
  if (content.length > maxChars) {
    return (
      <pre className="max-w-full overflow-auto bg-[rgb(30,30,30)] p-2 text-sm">
        <code className="text-white">{content}</code>
      </pre>
    );
  } else {
    return <SyntaxHighlighter language={lang || "text"} code={content} />;
  }
};

export const CodeBlock = ({ content, lang, messageRole }: CodeBlockProps) => {
  const maxCodeblockChars = useAtomValue(maxCodeblockCharsAtom);
  const {
    isPreviewMode,
    togglePreview,
    PreviewComponent,
    isSupported: isPreviewSupported,
  } = usePreview(lang);

  return (
    <div
      className="not-prose mb-2 min-w-0 rounded-md text-sm last:mb-0.5"
      style={{ clipPath: "inset(0 round 0.375rem)" }}
    >
      <div
        className={cn(
          "sticky top-0 z-10",
          messageRole === "user" ? "bg-secondary" : "bg-background",
        )}
      >
        <div className="flex items-center justify-between rounded-t-md bg-[rgb(30,30,30)] p-0 text-xs">
          <span className="ml-2 font-mono text-white">{lang || "text"}</span>
          <div className="flex items-center">
            {isPreviewSupported && (
              <Button
                size="icon"
                onClick={togglePreview}
                className="size-8 bg-[rgb(30,30,30)] text-white hover:bg-[rgb(30,30,30)]"
                aria-label={isPreviewMode ? "Stop preview" : "Preview code"}
              >
                {isPreviewMode ? (
                  <SquareIcon data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
              </Button>
            )}
            <CopyButton
              className="bg-[rgb(30,30,30)] text-white hover:bg-[rgb(30,30,30)]"
              text={content}
            />
          </div>
        </div>
      </div>
      <div className="shiki-container overflow-auto rounded-b-md">
        {isPreviewMode && PreviewComponent ? (
          <PreviewComponent content={content} />
        ) : (
          <BestHighlighter lang={lang || "text"} content={content} maxChars={maxCodeblockChars} />
        )}
      </div>
    </div>
  );
};

CodeBlock.displayName = "CodeBlock";
