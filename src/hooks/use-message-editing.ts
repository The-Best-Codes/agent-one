import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { getLogger } from "@/lib/logger";
import type { TextUIPart, UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const logger = getLogger(import.meta.url);

export interface UseMessageEditingOptions {
  message: UIMessage;
}

export interface UseMessageEditingReturn {
  isEditing: boolean;
  canEdit: boolean;
  isMobile: boolean;

  textValuesRef: React.RefObject<string[]>;
  editorRefs: React.RefObject<(HTMLDivElement | null)[]>;

  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  handleTextChange: (textIndex: number, next: string) => void;

  initialValues: string[];
}

export const useMessageEditing = ({
  message,
}: UseMessageEditingOptions): UseMessageEditingReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const { setMessages, regenerate } = useChatFunctions();

  const initialValues = useMemo(() => {
    return message.parts
      .filter((p): p is TextUIPart => p.type === "text")
      .map((p) => p.text);
  }, [message.parts]);

  const textValuesRef = useRef<string[]>(initialValues);
  const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  editorRefs.current.length = initialValues.length;

  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

  const canEdit = useMemo(
    () => message.parts.some((p) => p.type === "text"),
    [message.parts],
  );

  useEffect(() => {
    textValuesRef.current = [...initialValues];
  }, [initialValues]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    textValuesRef.current = [...initialValues];
  }, [initialValues]);

  const handleTextChange = useCallback((textIndex: number, next: string) => {
    textValuesRef.current[textIndex] = next;
  }, []);

  const handleSave = useCallback(() => {
    try {
      let idx = 0;
      const nextParts: UIMessage["parts"] = message.parts.map((part) => {
        if (part.type === "text") {
          const nextText = textValuesRef.current[idx] ?? "";
          idx += 1;
          return { ...part, text: nextText };
        }
        return part;
      });

      const hasOnlyTextParts = message.parts.every((p) => p.type === "text");
      const hasAnyNonEmptyText = textValuesRef.current.some(
        (t) => t.trim().length > 0,
      );
      if (hasOnlyTextParts && !hasAnyNonEmptyText) {
        handleCancel();
        return;
      }

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
          parts: nextParts,
        };

        return updatedMessages;
      });

      if (message.role === "user") {
        regenerate({ messageId: message.id });
      }

      setIsEditing(false);
    } catch (e) {
      logger.error(e);
      handleCancel();
    }
  }, [
    message.id,
    message.parts,
    message.role,
    regenerate,
    setMessages,
    handleCancel,
  ]);

  useEffect(() => {
    if (isEditing && initialValues.length > 0) {
      const lastIdx = initialValues.length - 1;
      const id = requestAnimationFrame(() => {
        const el = editorRefs.current[lastIdx];
        if (el) {
          el.scrollIntoView({ block: "nearest", behavior: "instant" });
        }
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [isEditing, initialValues.length]);

  return {
    isEditing,
    canEdit,
    isMobile,

    textValuesRef,
    editorRefs,

    handleEdit,
    handleCancel,
    handleSave,
    handleTextChange,

    initialValues,
  };
};
