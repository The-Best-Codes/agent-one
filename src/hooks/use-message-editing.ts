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
  // State
  isEditing: boolean;
  canEdit: boolean;
  isMobile: boolean;

  // Refs for editors
  textValuesRef: React.RefObject<string[]>;
  editorRefs: React.RefObject<(HTMLDivElement | null)[]>;

  // Handlers
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  handleTextChange: (textIndex: number, next: string) => void;

  // Computed values
  initialValues: string[];
}

export const useMessageEditing = ({
  message,
}: UseMessageEditingOptions): UseMessageEditingReturn => {
  const [isEditing, setIsEditing] = useState(false);
  const { setMessages, regenerate } = useChatFunctions();

  // Extract initial text values from message parts
  const initialValues = useMemo(() => {
    return message.parts
      .filter((p): p is TextUIPart => p.type === "text")
      .map((p) => p.text);
  }, [message.parts]);

  // Refs for managing text values and editor elements
  const textValuesRef = useRef<string[]>(initialValues);
  const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  editorRefs.current.length = initialValues.length;

  // Mobile detection for touch-specific behavior
  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

  // Determine if message can be edited (has text parts)
  const canEdit = useMemo(
    () => message.parts.some((p) => p.type === "text"),
    [message.parts],
  );

  // Update textValuesRef when initialValues change
  useEffect(() => {
    textValuesRef.current = [...initialValues];
  }, [initialValues]);

  // Handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Reset text values to initial state
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

      // Check if we should cancel instead of save (empty text-only message)
      const hasOnlyTextParts = message.parts.every((p) => p.type === "text");
      const hasAnyNonEmptyText = textValuesRef.current.some(
        (t) => t.trim().length > 0,
      );
      if (hasOnlyTextParts && !hasAnyNonEmptyText) {
        handleCancel();
        return;
      }

      // Update the message in the chat
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

      // Regenerate if it's a user message
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

  // Auto-scroll to last editor when editing starts
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
    // State
    isEditing,
    canEdit,
    isMobile,

    // Refs
    textValuesRef,
    editorRefs,

    // Handlers
    handleEdit,
    handleCancel,
    handleSave,
    handleTextChange,

    // Computed values
    initialValues,
  };
};
