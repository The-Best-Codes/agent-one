import type { TextUIPart, UIMessage } from "ai";

import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import { PerformantMarkdown } from "@/components/a1/markdown/performant-markdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettings } from "@/contexts/use-settings/settings-hooks";
import { cn } from "@/lib/utils";

const MAX_CHARS = 100000; // TODO: Allow user to configure this value (in settings?)

export const MessagePartText = ({
  id,
  text,
  messageRole,
}: {
  id: string;
  text: TextUIPart["text"];
  messageRole: UIMessage["role"];
}) => {
  const { settings } = useSettings();
  const shouldUsePerformantRenderer = text.length > MAX_CHARS;

  if (!text) return null;

  const shouldRenderMarkdown = (() => {
    const renderingOption = settings.MARKDOWN_RENDERING.value;
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
        shouldRenderMarkdown &&
          "prose dark:prose-invert prose-sm prose-neutral prose-code:select-all",
      )}
    >
      {shouldUsePerformantRenderer ? (
        <>
          <Alert variant="destructive" className="mb-2">
            <AlertTitle>Performance Alert</AlertTitle>
            <AlertDescription>
              This message is longer than {MAX_CHARS} characters. Syntax
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
