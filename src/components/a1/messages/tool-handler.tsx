import type { ToolUIPart, UIMessage } from "ai";
import { deepEqual } from "fast-equals";
import { memo } from "react";

import { getLogger } from "@/lib/logger";

import { MessagePartFallback } from "./parts/fallback";
import { MessagePartToolCall } from "./tools/tool-call";
import { MessagePartToolDateTime } from "./tools/tool-dateTime";
import { MessagePartToolGetUrlContent } from "./tools/tool-getUrlContent";
import { MessagePartToolWaitNumberMilliseconds } from "./tools/tool-waitNumberMilliseconds";
import { MessagePartToolWebSearch } from "./tools/tool-webSearch";

const logger = getLogger(import.meta.url);

type MessageToolHandlerProps = {
  part: UIMessage["parts"][number];
};

export const MessageToolHandler = memo(
  ({ part }: MessageToolHandlerProps) => {
    if (!part.type.startsWith("tool-")) {
      logger.error(
        `MessagePartToolHandler received a non-tool part type: ${part.type}`,
      );
      return <MessagePartFallback {...part} />;
    }

    switch (part.type) {
      case "tool-dateTime":
        return <MessagePartToolDateTime part={part} />;
      case "tool-waitNumberMilliseconds":
        return <MessagePartToolWaitNumberMilliseconds part={part} />;
      case "tool-getUrlContent":
        return <MessagePartToolGetUrlContent part={part} />;
      case "tool-webSearch":
        return <MessagePartToolWebSearch part={part} />;
      default:
        return <MessagePartToolCall part={part as ToolUIPart} />;
    }
  },
  (prevProps, nextProps) => {
    return deepEqual(prevProps.part, nextProps.part);
  },
);

MessageToolHandler.displayName = "MessageToolHandler";
