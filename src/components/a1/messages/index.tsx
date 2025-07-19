import type { ToolUIPart, UIMessage } from "ai";
import { memo } from "react";
import { MessageGroup } from "./group";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartText } from "./parts/text";
import { MessagePartToolCall } from "./parts/tool-call";
import { MessagePartToolWeather } from "./parts/tool-weather";

export const MessageParts = memo(({ message }: { message: UIMessage }) => {
  return (
    <MessageGroup messageRole={message.role}>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return (
              <MessagePartText
                key={`${message.id}-${i}`}
                id={message.id}
                text={part.text}
              />
            );
          case "step-start":
            return <MessagePartStepStart key={`${message.id}-${i}`} />;
          // TODO: Move tool case handling to a seperate file and import it here
          case "tool-weather":
            return (
              <MessagePartToolWeather key={`${message.id}-${i}`} part={part} />
            );
          default:
            if (part.type.startsWith("tool-")) {
              return (
                <MessagePartToolCall
                  key={`${message.id}-${i}`}
                  part={part as ToolUIPart}
                />
              );
            }

            console.error(
              `Unknown or unhandled message part type: ${part.type}`,
            );
            return <MessagePartFallback key={`${message.id}-${i}`} {...part} />;
        }
      })}
    </MessageGroup>
  );
});

MessageParts.displayName = "MessageParts";
