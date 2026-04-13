import type { TextUIPart, UIMessage } from "ai";
import { useAtomValue } from "jotai";

import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import { PerformantMarkdown } from "@/components/a1/markdown/performant-markdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { markdownRenderingAtom, maxMessageLengthAtom } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

export const MessagePartText = ({
  id,
  text,
  messageRole,
}: {
  id: string;
  text: TextUIPart["text"];
  messageRole: UIMessage["role"];
}) => {
  const maxMessageLength = useAtomValue(maxMessageLengthAtom);
  const markdownRendering = useAtomValue(markdownRenderingAtom);
  const shouldUsePerformantRenderer = text.length > maxMessageLength;

  if (!text || text.trim() === "") return null;

  const shouldRenderMarkdown = (() => {
    const renderingOption = markdownRendering;
    if (renderingOption === "both") return true;
    if (renderingOption === "neither") return false;
    if (renderingOption === "user") return messageRole === "user";
    if (renderingOption === "assistant") return messageRole === "assistant";
    return true; // fallback
  })();

  return (
    <div
      className={cn(
        "max-w-full rounded-md text-base",
        shouldRenderMarkdown && "prose dark:prose-invert prose-sm prose-neutral",
      )}
    >
      {shouldUsePerformantRenderer ? (
        <>
          <Alert variant="destructive" className="mb-2">
            <AlertTitle>Performance Alert</AlertTitle>
            <AlertDescription>
              This message is longer than {maxMessageLength.toLocaleString()} characters. Syntax
              highlighting and markdown rendering are disabled.
            </AlertDescription>
          </Alert>
          <PerformantMarkdown content={text} />
        </>
      ) : shouldRenderMarkdown ? (
        <MemoizedMarkdown id={id} content={text} messageRole={messageRole} />
      ) : (
        <pre
          className="text-base break-words whitespace-pre-wrap"
          style={{
            fontFamily: "inherit",
          }}
        >
          {text}
        </pre>
      )}
    </div>
  );
};
