"use client";
import {
  useChatFunctions,
  useChatMessages,
} from "@/contexts/use-chat/chat-hooks";
import { getLogger } from "@/lib/logger";
import { type TextUIPart, type UIMessage } from "ai";
import { memo, useCallback, useMemo, useState } from "react";
import { MessageEditor } from "./editor";
import { MessageParts } from "./index";

const logger = getLogger(import.meta.url);

const EditableMessageInternal = ({ message }: { message: UIMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { setMessages, regenerate } = useChatFunctions();
  const messages = useChatMessages();

  const textContent = useMemo(
    () =>
      message.parts
        .filter((part): part is TextUIPart => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
    [message.parts],
  );

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(
    (newContent: string) => {
      const messageIndex = messages.findIndex((m) => m.id === message.id);
      if (messageIndex === -1) {
        logger.error("Could not find message to edit.");
        setIsEditing(false);
        return;
      }

      const updatedMessages = [...messages];
      const originalMessage = updatedMessages[messageIndex];

      const newParts: UIMessage["parts"] = [];
      let textPartUpdated = false;

      for (const part of originalMessage.parts) {
        if (part.type === "text") {
          if (!textPartUpdated) {
            newParts.push({ type: "text", text: newContent });
            textPartUpdated = true;
          }
        } else {
          newParts.push(part);
        }
      }

      if (!textPartUpdated) {
        newParts.push({ type: "text", text: newContent });
      }

      updatedMessages[messageIndex] = {
        ...originalMessage,
        parts: newParts,
      };

      setMessages(updatedMessages);

      if (message.role === "user") {
        regenerate({ messageId: message.id });
      }

      setIsEditing(false);
    },
    [messages, message.id, message.role, regenerate, setMessages],
  );

  const canEdit = useMemo(
    () => message.parts.some((p) => p.type === "text"),
    [message.parts],
  );

  if (isEditing) {
    return (
      <MessageEditor
        initialContent={textContent}
        onSave={handleSave}
        onCancel={handleCancel}
        messageRole={message.role}
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
