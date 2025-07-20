import { CopyButton } from "@/components/a1/copy-button";
import { cn } from "@/lib/utils";
import { codeToHtml } from "shiki";
import type { UIMessage } from "ai";
import { memo, useEffect, useState } from "react";

type CodeBlockProps = {
  content: string;
  lang?: string;
  messageRole?: UIMessage["role"];
};

export const CodeBlock = memo(
  ({ content, lang, messageRole }: CodeBlockProps) => {
    const [highlightedHtml, setHighlightedHtml] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
      const highlightCode = async () => {
        setIsLoading(true);
        try {
          const html = await codeToHtml(content, {
            lang: lang || "text",
            theme: "github-dark",
          });
          setHighlightedHtml(html);
        } catch (error) {
          console.error(
            `Failed to highlight code with Shiki for language "${lang}":`,
            error,
          );
          setHighlightedHtml(`<pre><code>${content}</code></pre>`);
        } finally {
          setIsLoading(false);
        }
      };

      highlightCode();
    }, [content, lang]);

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
          <div className="flex rounded-t-md items-center justify-between bg-[#0d1117] text-xs p-0">
            <span className="ml-2 font-mono text-white">
              {lang || "unknown"}
            </span>
            <CopyButton
              className="bg-[#0d1117] hover:bg-[#0d1117] text-white"
              text={content}
            />
          </div>
        </div>
        <div className="overflow-auto rounded-b-md shiki-container">
          {isLoading ? (
            <div className="bg-[#0d1117] text-white p-4">Loading code...</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
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
