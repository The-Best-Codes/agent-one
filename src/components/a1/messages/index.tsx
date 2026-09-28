import type { TextUIPart, ToolUIPart, UIMessage } from "ai";
import { useSetAtom } from "jotai";
import { memo, useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useGetChatMessages } from "@/contexts/use-chat/chat-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import type { ToolDisplayLabels } from "@/lib/ai/tools/describeNextTool";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { setMessageEditingAtom } from "@/lib/jotai/chat-message-editing-atoms";
import { getLogger } from "@/lib/logger";

// When these imports are updates, check if ./src/components/a1/messages/parts/subagent-transcript.tsx needs to be updated as well!
import { ChatMessageLoading } from "../chat-message-loading";
import { MessageGroup } from "./group";
import { MessagePartDynamicTool } from "./parts/dynamic-tool";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartFile } from "./parts/file";
import { MessagePartReasoning } from "./parts/reasoning";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartText } from "./parts/text";
import { MessageToolHandler } from "./tool-handler";
import { UserMessageEditor } from "./user-message-editor";

const logger = getLogger(import.meta.url);

const MessagePartsInternal = ({
  message,
  isLastMessage,
}: {
  message: UIMessage;
  isLastMessage?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const setMessageEditing = useSetAtom(setMessageEditingAtom);

  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();
  const { branchChat } = usePersistence();
  const getMessages = useGetChatMessages();

  const handleEdit = useCallback(() => {
    setMessageEditing({ isEditing: true, messageId: message.id });
    setIsEditing(true);
  }, [message.id, setMessageEditing]);

  const handleCloseEditor = useCallback(() => {
    setMessageEditing({ isEditing: false, messageId: message.id });
    setIsEditing(false);
  }, [message.id, setMessageEditing]);

  const handleBranch = useCallback(() => {
    if (!activeChatId) {
      logger.error("Cannot branch a new, unsaved chat.");
      return;
    }
    try {
      const newChatId = branchChat({
        originalChatId: activeChatId,
        branchFromMessageId: message.id,
        messages: getMessages(),
      });
      void navigate(`/chat/${newChatId}`);
    } catch (error) {
      logger.error("Failed to branch chat:", error);
    }
  }, [activeChatId, message.id, navigate, branchChat, getMessages]);

  const getCopyContent = useCallback(() => {
    return message.parts
      .map((part) => {
        if (part.type === "text") {
          return (part as TextUIPart).text;
        } else if (part.type === "file") {
          return `[File: ${part.filename || "Unnamed file"}]`;
        } else if (part.type === "reasoning") {
          return `[Reasoning: ${part.text}]`;
        } else if (part.type === "source-url") {
          return `[Source URL: ${part?.title || "Untitled URL"}, ${part?.url || "Unknown URL"}]`;
        } else if (part.type === "source-document") {
          return `[Source Document: ${part?.title || "Unnamed document"}, ${
            part?.filename || "Unnamed file"
          }]`;
        } else if (part.type.startsWith("data-")) {
          return `[Data: ${JSON.stringify(part)}]`;
        } else if (part.type === "tool-describeNextTool") {
          return null;
        } else if (part.type.startsWith("tool-")) {
          const toolPart = part as ToolUIPart;
          return `[Tool: ${getToolDisplayName(toolPart.type.replace("tool-", ""), toolPart.title)}]`;
        } else if (part.type === "dynamic-tool") {
          return `[Dynamic Tool: ${getToolDisplayName(part.toolName, part.title)}]`;
        } else if (part.type === "step-start") {
          return null; // Nothing for now
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }, [message.parts]);

  const getTextToSpeechContent = useCallback(() => {
    return message.parts
      .map((part) => {
        if (part.type === "text") {
          return (part as TextUIPart).text;
        }

        return null;
      })
      .filter(Boolean)
      .join("\n");
  }, [message.parts]);

  const renderedParts = useMemo(() => {
    return message.parts.map((part, i) => {
      const key =
        "toolCallId" in part && (part as ToolUIPart).toolCallId
          ? (part as ToolUIPart).toolCallId!
          : `${message.id}-${i}`;

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
          return (
            <MessagePartReasoning
              key={key}
              id={message.id}
              text={part.text}
              isBusy={isLastMessage && i === message.parts.length - 1}
            />
          );

        case "step-start":
          return <MessagePartStepStart key={key} />;
        case "file":
          return <MessagePartFile key={key} file={part} />;
        case "dynamic-tool": {
          let toolLabels: ToolDisplayLabels | null = null;
          for (let j = i - 1; j >= 0; j--) {
            const prev = message.parts[j];
            if (prev.type === "tool-describeNextTool" && "input" in prev && prev.input) {
              const inp = prev.input as Record<string, string | undefined>;
              toolLabels = {
                loadingTitle: inp.loadingTitle,
                completedTitle: inp.completedTitle,
                errorTitle: inp.errorTitle,
              };
              break;
            }
            if (prev.type === "dynamic-tool" || prev.type.startsWith("tool-")) break;
          }
          return <MessagePartDynamicTool key={key} part={part} labels={toolLabels} />;
        }
        default:
          if (part.type.startsWith("tool-")) {
            return <MessageToolHandler key={key} part={{ ...part }} />; // Using a spread operator to ensure React.memo will get a new instance of part
          }

          logger.error(`Unknown or unhandled message part type: ${part.type}`);
          return <MessagePartFallback key={key} {...part} />;
      }
    });
  }, [isLastMessage, message.id, message.parts, message.role]);

  const content = (
    <>
      {renderedParts}
      <ChatMessageLoading mode="inMessage" messageId={message.id} messageRole={message.role} />
    </>
  );

  if (isEditing) {
    return <UserMessageEditor message={message} onClose={handleCloseEditor} />;
  }

  return (
    <MessageGroup
      contentToCopy={getCopyContent()}
      contentToSpeak={getTextToSpeechContent()}
      messageRole={message.role}
      messageId={message.id}
      onEdit={
        message.role === "user" && message.parts.some((part) => part.type === "text")
          ? handleEdit
          : undefined
      }
      onBranch={activeChatId ? handleBranch : undefined}
    >
      {content}
    </MessageGroup>
  );
};

export const MessageParts = memo(MessagePartsInternal);
MessageParts.displayName = "MessageParts";
