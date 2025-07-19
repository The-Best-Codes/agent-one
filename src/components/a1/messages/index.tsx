import type { UIMessage } from "ai";
import { memo } from "react";
import { MessageGroup } from "./group";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartText } from "./parts/text";
import { MessageToolHandler } from "./tool-handler";

export const MessageParts = memo(({ message }: { message: UIMessage }) => {
  return (
    <MessageGroup messageRole={message.role}>
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;

        switch (part.type) {
          case "text":
            return (
              <MessagePartText key={key} id={message.id} text={part.text} />
            );
          case "step-start":
            return <MessagePartStepStart key={key} />;
          default:
            if (part.type.startsWith("tool-")) {
              return (
                <MessageToolHandler key={key} id={message.id} part={part} />
              );
            }

            console.error(
              `Unknown or unhandled message part type: ${part.type}`,
            );
            return <MessagePartFallback key={key} {...part} />;
        }
      })}
    </MessageGroup>
  );
});

MessageParts.displayName = "MessageParts";
