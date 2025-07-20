import { CopyButton } from "@/components/a1/copy-button";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { memo, useState } from "react";
import { SyntaxHighlighter } from "./shiki-highlighter";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type CodeBlockProps = {
  content: string;
  lang?: string;
  messageRole?: UIMessage["role"];
};

export const CodeBlock = memo(
  ({ content, lang, messageRole }: CodeBlockProps) => {
    const [isPreviewMode, setIsPreviewMode] = useState(false); // TODO: Extract preview logic to other files

    const isHtml = lang === "html"; // Preview will support other languages in the future, and maybe open in canvas if I add that?

    const togglePreview = () => {
      setIsPreviewMode((prev) => !prev);
    };

    return (
      <div
        className="not-prose text-sm min-w-0 rounded-md"
        style={{ clipPath: "inset(0 round 0.375rem)" }}
      >
        <div
          className={cn(
            "sticky top-0 z-10",
            messageRole === "user" ? "bg-secondary" : "bg-background",
          )}
        >
          <div className="flex rounded-t-md items-center justify-between bg-[rgb(36,41,46)] text-xs p-0">
            <span className="ml-2 font-mono text-white">{lang || "text"}</span>
            <div className="flex items-center">
              {isHtml && (
                <Button
                  size="icon"
                  onClick={togglePreview}
                  className="w-8 h-8 bg-[rgb(36,41,46)] hover:bg-[rgb(36,41,46)] text-white"
                  title={isPreviewMode ? "Stop preview" : "Preview HTML"}
                >
                  {isPreviewMode ? <Square size={16} /> : <Play size={16} />}
                </Button>
              )}
              <CopyButton
                className="bg-[rgb(36,41,46)] hover:bg-[rgb(36,41,46)] text-white"
                text={content}
              />
            </div>
          </div>
        </div>
        <div className="overflow-auto rounded-b-md shiki-container">
          {isPreviewMode && isHtml ? (
            <iframe
              srcDoc={content}
              title="HTML Preview"
              className="w-full h-96 border-0 bg-white"
              sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
            />
          ) : (
            <SyntaxHighlighter language={lang || "text"} code={content} />
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.lang === nextProps.lang
    );
  },
);

CodeBlock.displayName = "CodeBlock";
