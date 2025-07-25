import type { TextUIPart, UIMessage } from "ai";
import { memo } from "react";
import { ChatMessageLoading } from "../chat-message-loading";
import { MessageGroup } from "./group";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartReasoning } from "./parts/reasoning";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartText } from "./parts/text";
import { MessageToolHandler } from "./tool-handler";

export const MessageParts = memo(({ message }: { message: UIMessage }) => {
  const getCopyContent = () => {
    return message.parts
      .map((part) =>
        typeof (part as TextUIPart)?.text === "string"
          ? (part as TextUIPart).text
          : "",
      )
      .join("\n");
  };

  return (
    <MessageGroup
      contentToCopy={getCopyContent()}
      messageRole={message.role}
      messageId={message.id}
    >
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;

        switch (part.type) {
          case "text":
            return (
              <MessagePartText
                key={key}
                id={message.id}
                text={part.text}
                messageRole={message.role}
              />
            );
          case "reasoning":
            return <MessagePartReasoning key={key} text={part.text} />;
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
      <ChatMessageLoading
        mode="inMessage"
        messageId={message.id}
        messageRole={message.role}
      />
    </MessageGroup>
  );
});

MessageParts.displayName = "MessageParts";
