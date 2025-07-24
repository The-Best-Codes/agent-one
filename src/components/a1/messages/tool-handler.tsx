import type { ToolUIPart, UIMessage } from "ai";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartToolCall } from "./tools/tool-call";
import { MessagePartToolDateTime } from "./tools/tool-dateTime";
import { MessagePartToolGetUrlContent } from "./tools/tool-getUrlContent";
import { MessagePartToolWaitNumberMilliseconds } from "./tools/tool-waitNumberMilliseconds";

type MessageToolHandlerProps = {
  id: string;
  part: UIMessage["parts"][number];
};

export function MessageToolHandler({ id, part }: MessageToolHandlerProps) {
  if (!part.type.startsWith("tool-")) {
    console.error(
      `MessagePartToolHandler received a non-tool part type: ${part.type}`,
    );
    return <MessagePartFallback key={`${id}-${part.type}`} {...part} />;
  }

  switch (part.type) {
    case "tool-dateTime":
      return <MessagePartToolDateTime key={`${id}-${part.type}`} part={part} />;
    case "tool-waitNumberMilliseconds":
      return (
        <MessagePartToolWaitNumberMilliseconds
          key={`${id}-${part.type}`}
          part={part}
        />
      );
    case "tool-getUrlContent":
      return (
        <MessagePartToolGetUrlContent key={`${id}-${part.type}`} part={part} />
      );
    default:
      return (
        <MessagePartToolCall
          key={`${id}-${part.type}`}
          part={part as ToolUIPart}
        />
      );
  }
}

MessageToolHandler.displayName = "MessageToolHandler";
