import { MessagePartText } from "./parts/text";

import type { UIMessage } from "ai";
import { MessagePartsGroup } from "./parts-group";
import { MessagePartFallback } from "./parts/fallback";

const partsMap = {
  text: MessagePartText,
};

export const MessageParts = ({ message }: { message: UIMessage }) => {
  return (
    <MessagePartsGroup>
      {message.parts.map((part: (typeof message.parts)[number], i) => {
        const Part = (partsMap as any)[part.type];
        if (!Part) {
          console.error(`Unknown or unhandled message part type: ${part.type}`);
          return <MessagePartFallback key={`${message.id}-${i}`} {...part} />;
        }

        return <Part key={`${message.id}-${i}`} {...part} />;
      })}
    </MessagePartsGroup>
  );
};
