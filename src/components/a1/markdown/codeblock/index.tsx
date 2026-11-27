import { IconCode, IconEye } from "@tabler/icons-react";
import type { UIMessage } from "ai";
import { useAtomValue } from "jotai";

import { CopyButton } from "@/components/a1/copy-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/use-theme";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

import { usePreview } from "./preview";
import { SyntaxHighlighter } from "./shiki-highlighter";

type CodeBlockProps = {
  content: string;
  lang?: string;
  complete?: boolean;
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
  const { resolvedTheme } = useTheme();

  if (content.length > maxChars) {
    return (
      <pre className="max-w-full overflow-auto p-2 text-sm">
        <code>{content}</code>
      </pre>
    );
  } else {
    return (
      <SyntaxHighlighter
        language={lang || "text"}
        code={content}
        theme={resolvedTheme === "dark" ? "dark-plus" : "light-plus"}
      />
    );
  }
};

export const CodeBlock = ({ content, lang, complete = true, messageRole }: CodeBlockProps) => {
  const maxCodeblockChars = useAtomValue(settingAtoms.MAX_CODEBLOCK_CHARS);
  const {
    isPreviewMode,
    togglePreview,
    PreviewComponent,
    isSupported: isPreviewSupported,
  } = usePreview(lang);

  return (
    <div
      className="not-prose mb-2 min-w-0 rounded-md text-sm last:mb-0.5"
      style={{ clipPath: "inset(0 round 0.25rem)" }}
    >
      <div
        className={cn(
          "sticky top-0 z-10",
          messageRole === "user" ? "bg-secondary" : "bg-background",
        )}
      >
        <div className="bg-muted flex items-center justify-between rounded-t-md border p-0 text-xs">
          <span className="ml-2 font-mono">{lang || "text"}</span>
          <div className="flex items-center">
            {isPreviewSupported && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={togglePreview}
                  aria-label={isPreviewMode ? "Stop preview" : "Preview code"}
                >
                  {isPreviewMode ? (
                    <IconCode data-icon="inline-start" />
                  ) : (
                    <IconEye data-icon="inline-start" />
                  )}
                </Button>
                <Separator orientation="vertical" />
              </>
            )}
            <CopyButton
              variants={{ idle: "ghost", copying: "ghost", success: "ghost", error: "ghost" }}
              text={content}
            />
          </div>
        </div>
      </div>
      <div className="bg-background overflow-auto rounded-b-md border border-t-0">
        {isPreviewMode && PreviewComponent ? (
          <PreviewComponent content={content} complete={complete} />
        ) : (
          <BestHighlighter lang={lang || "text"} content={content} maxChars={maxCodeblockChars} />
        )}
      </div>
    </div>
  );
};

CodeBlock.displayName = "CodeBlock";
