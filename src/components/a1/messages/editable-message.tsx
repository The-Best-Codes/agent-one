"use client";
import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import { getLogger } from "@/lib/logger";
import { type UIMessage } from "ai";
import { memo, useCallback, useMemo, useState } from "react";
import { MessageParts } from "./index";
import { EditableMessageParts } from "./editable-message-parts";

const logger = getLogger(import.meta.url);

const EditableMessageInternal = ({ message }: { message: UIMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { setMessages, regenerate } = useChatFunctions();

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveParts = useCallback(
    (updatedParts: UIMessage["parts"]) => {
      setMessages((currentMessages) => {
        const messageIndex = currentMessages.findIndex(
          (m) => m.id === message.id,
        );
        if (messageIndex === -1) {
          logger.error("Could not find message to edit.");
          return currentMessages;
        }

        const updatedMessages = [...currentMessages];
        const originalMessage = updatedMessages[messageIndex];

        updatedMessages[messageIndex] = {
          ...originalMessage,
          parts: updatedParts,
        };

        return updatedMessages;
      });

      if (message.role === "user") {
        regenerate({ messageId: message.id });
      }

      setIsEditing(false);
    },
    [message.id, message.role, regenerate, setMessages],
  );

  const canEdit = useMemo(
    () => message.parts.some((p) => p.type === "text"),
    [message.parts],
  );

  if (isEditing) {
    return (
      <EditableMessageParts
        message={message}
        onCancel={handleCancel}
        onSave={handleSaveParts}
        className="w-full"
      />
    );
  }

  return (
    <MessageParts message={message} onEdit={canEdit ? handleEdit : undefined} />
  );
};

export const EditableMessage = memo(EditableMessageInternal);
EditableMessage.displayName = "EditableMessage";
