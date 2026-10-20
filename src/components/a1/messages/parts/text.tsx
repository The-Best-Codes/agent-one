import type { TextUIPart, UIMessage } from "ai";
import { useAtomValue } from "jotai";

import { MemoizedMarkdown } from "@/components/a1/markdown/memoized-markdown";
import { PerformantMarkdown } from "@/components/a1/markdown/performant-markdown";
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

export const MessagePartText = ({
  id,
  text,
  messageRole,
  isBusy,
}: {
  id: string;
  text: TextUIPart["text"];
  messageRole: UIMessage["role"];
  isBusy?: boolean;
}) => {
  const { status } = useChatStatus();
  const isStreaming = !!isBusy && (status === "streaming" || status === "submitted");
  const maxMessageLength = useAtomValue(settingAtoms.MAX_MESSAGE_LENGTH);
  const markdownRendering = useAtomValue(settingAtoms.MARKDOWN_RENDERING);
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
        shouldRenderMarkdown && "prose dark:prose-invert prose-sm prose-neutral prose-quoteless",
      )}
    >
      {shouldUsePerformantRenderer ? (
        <>
          <PerformantMarkdown content={text} />
        </>
      ) : shouldRenderMarkdown ? (
        <MemoizedMarkdown
          id={id}
          content={text}
          messageRole={messageRole}
          streaming={isStreaming}
        />
      ) : (
        <pre
          className="text-base wrap-break-word whitespace-pre-wrap"
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
