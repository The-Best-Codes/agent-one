import type { TextUIPart, UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useChatFunctions } from "@/contexts/use-chat/chat-hooks";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { getLogger } from "@/lib/logger";

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
  handleSave: (shouldRegenerate?: boolean) => void;
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
    editorRefs.current.length = initialValues.length;
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

  const handleSave = useCallback(
    (shouldRegenerate?: boolean) => {
      try {
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

          const hasOnlyTextParts = originalMessage.parts.every(
            (p) => p.type === "text",
          );
          const hasAnyNonEmptyText = textValuesRef.current.some(
            (t) => t.trim().length > 0,
          );

          if (hasOnlyTextParts && !hasAnyNonEmptyText) {
            return currentMessages;
          }

          let idx = 0;
          const nextParts: UIMessage["parts"] = originalMessage.parts.map(
            (part) => {
              if (part.type === "text") {
                const nextText = textValuesRef.current[idx] ?? "";
                idx += 1;
                return { ...part, text: nextText };
              }
              return part;
            },
          );

          updatedMessages[messageIndex] = {
            ...originalMessage,
            parts: nextParts,
          };

          return updatedMessages;
        });

        setIsEditing(false);

        if (shouldRegenerate) {
          regenerate({ messageId: message.id });
        }
      } catch (e) {
        logger.error(e);
        handleCancel();
      }
    },
    [setMessages, message.id, regenerate, handleCancel],
  );

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
