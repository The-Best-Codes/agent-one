import type { UIMessage } from "ai";
import { MessagePartsGroup } from "./parts-group";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartText } from "./parts/text";

export const MessageParts = ({ message }: { message: UIMessage }) => {
  return (
    <MessagePartsGroup>
      {message.parts.map((part: (typeof message.parts)[number], i) => {
        switch (part.type) {
          case "text":
            return (
              <MessagePartText
                key={`${message.id}-${i}`}
                id={message.id}
                {...part}
              />
            );
          case "step-start":
            return (
              <MessagePartStepStart key={`${message.id}-${i}`} {...part} />
            );
          default:
            console.error(
              `Unknown or unhandled message part type: ${part.type}`,
            );
            return <MessagePartFallback key={`${message.id}-${i}`} {...part} />;
        }
      })}
    </MessagePartsGroup>
  );
};
