import type { ToolUIPart, UIMessage } from "ai";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartToolCall } from "./parts/tool-call";
import { MessagePartToolDateTime } from "./parts/tool-dateTime";
import { MessagePartToolWeather } from "./parts/tool-weather";

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
    case "tool-weather":
      return <MessagePartToolWeather key={`${id}-${part.type}`} part={part} />;
    case "tool-dateTime":
      return <MessagePartToolDateTime key={`${id}-${part.type}`} part={part} />;
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
