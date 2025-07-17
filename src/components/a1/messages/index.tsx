import type { UIMessage } from "ai";
import { memo } from "react";
import { MessagePartsGroup } from "./parts-group";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartText } from "./parts/text";

export const MessageParts = memo(({ message }: { message: UIMessage }) => {
  return (
    <MessagePartsGroup>
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
          default:
            console.error(
              `Unknown or unhandled message part type: ${part.type}`,
            );
            return <MessagePartFallback key={`${message.id}-${i}`} {...part} />;
        }
      })}
    </MessagePartsGroup>
  );
});

MessageParts.displayName = "MessageParts";
