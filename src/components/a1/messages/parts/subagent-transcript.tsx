import type { UIMessage } from "ai";

import { MessagePartDynamicTool } from "../parts/dynamic-tool";
import { MessagePartFallback } from "../parts/fallback";
import { MessagePartFile } from "../parts/file";
import { MessagePartReasoning } from "../parts/reasoning";
import { MessagePartStepStart } from "../parts/step-start";
import { MessagePartText } from "../parts/text";
import { MessageToolHandler } from "../tool-handler";

export function SubagentTranscript({ message }: { message: UIMessage }) {
  return (
    <div className="flex flex-col gap-2">
      {message.parts.map((part, index) => {
        const key =
          "toolCallId" in part && part.toolCallId ? part.toolCallId : `${message.id}-${index}`;

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
            return <MessagePartReasoning key={key} id={message.id} text={part.text} />;
          case "step-start":
            return <MessagePartStepStart key={key} />;
          case "file":
            return <MessagePartFile key={key} file={part} />;
          case "dynamic-tool":
            return <MessagePartDynamicTool key={key} part={part} labels={null} />;
          default:
            if (part.type.startsWith("tool-")) {
              return <MessageToolHandler key={key} part={{ ...part }} />;
            }

            return <MessagePartFallback key={key} {...part} />;
        }
      })}
    </div>
  );
}
