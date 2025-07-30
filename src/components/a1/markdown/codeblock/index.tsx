import { CopyButton } from "@/components/a1/copy-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { PlayIcon, SquareIcon } from "lucide-react";
import { usePreview } from "./preview";
import { SyntaxHighlighter } from "./shiki-highlighter";

type CodeBlockProps = {
  content: string;
  lang?: string;
  messageRole?: UIMessage["role"];
};

const MAX_CHARS = 10000; // TODO: Allow user to configure this (in settings?)

const BestHighlighter = ({
  content,
  lang,
}: {
  content: string;
  lang?: string;
}) => {
  if (content.length > MAX_CHARS) {
    return (
      <pre className="bg-[rgb(30,30,30)] text-xs p-2 max-w-full overflow-auto">
        <code className="text-white">{content}</code>
      </pre>
    );
  } else {
    return <SyntaxHighlighter language={lang || "text"} code={content} />;
  }
};

export const CodeBlock = ({ content, lang, messageRole }: CodeBlockProps) => {
  const {
    isPreviewMode,
    togglePreview,
    PreviewComponent,
    isSupported: isPreviewSupported,
  } = usePreview(lang);

  return (
    <div
      className="not-prose text-sm min-w-0 rounded-md mb-6 last:mb-1"
      style={{ clipPath: "inset(0 round 0.375rem)" }}
    >
      <div
        className={cn(
          "sticky -top-2 z-10",
          messageRole === "user" ? "bg-secondary" : "bg-background",
        )}
      >
        <div className="flex rounded-t-md items-center justify-between bg-[rgb(30,30,30)] text-xs p-0">
          <span className="ml-2 font-mono text-white">{lang || "text"}</span>
          <div className="flex items-center">
            {isPreviewSupported && (
              <Button
                size="icon"
                onClick={togglePreview}
                className="size-8 bg-[rgb(30,30,30)] hover:bg-[rgb(30,30,30)] text-white"
                title={isPreviewMode ? "Stop preview" : "Preview HTML"}
              >
                {isPreviewMode ? <SquareIcon /> : <PlayIcon />}
              </Button>
            )}
            <CopyButton
              className="bg-[rgb(30,30,30)] hover:bg-[rgb(30,30,30)] text-white"
              text={content}
            />
          </div>
        </div>
      </div>
      <div className="overflow-auto rounded-b-md shiki-container">
        {isPreviewMode && PreviewComponent ? (
          <PreviewComponent content={content} />
        ) : (
          <BestHighlighter lang={lang || "text"} content={content} />
        )}
      </div>
    </div>
  );
};

CodeBlock.displayName = "CodeBlock";
