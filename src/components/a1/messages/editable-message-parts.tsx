"use client";
import { Button } from "@/components/ui/button";
import { getLogger } from "@/lib/logger";
import type { TextUIPart, ToolUIPart, UIMessage } from "ai";
import { useMemo, useState, useCallback } from "react";
import { InlineTextEditor } from "./inline-text-editor";
import { MessagePartReasoning } from "./parts/reasoning";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartFile } from "./parts/file";
import { MessagePartFallback } from "./parts/fallback";
import { MessageToolHandler } from "./tool-handler";
import { cn } from "@/lib/utils";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { CheckIcon, XIcon } from "lucide-react";

const logger = getLogger(import.meta.url);

interface EditableMessagePartsProps {
  message: UIMessage;
  onCancel: () => void;
  onSave: (updatedParts: UIMessage["parts"]) => void;
  className?: string;
}

/**
 * EditableMessageParts
 * Renders the entire message content, swapping only text parts for inline editors.
 * Non-text parts (tools, files, reasoning, etc.) are rendered read-only using existing components.
 * Save/Cancel buttons are shown at the bottom. Saving reconstructs the original parts array with updated text values.
 */
export const EditableMessageParts = ({
  message,
  onCancel,
  onSave,
  className,
}: EditableMessagePartsProps) => {
  // Capture initial text part values in-order
  const textValues = useMemo(() => {
    return message.parts
      .filter((p): p is TextUIPart => p.type === "text")
      .map((p) => p.text);
  }, [message.parts]);

  // Maintain edited values mapped by text-part order
  const [editedTextValues, setEditedTextValues] = useState<string[]>(
    () => [...textValues],
  );

  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

  const handleTextChange = useCallback((textIndex: number, next: string) => {
    setEditedTextValues((prev) => {
      const copy = [...prev];
      copy[textIndex] = next;
      return copy;
    });
  }, []);

  const handleSave = useCallback(() => {
    try {
      // Rebuild parts preserving everything except text content
      let idx = 0;
      const nextParts: UIMessage["parts"] = message.parts.map((part) => {
        if (part.type === "text") {
          const nextText = editedTextValues[idx] ?? "";
          idx += 1;
          return { ...part, text: nextText };
        }
        return part;
      });

      // If message is only text parts and all edits are empty/whitespace, behave like cancel
      const hasOnlyTextParts = message.parts.every((p) => p.type === "text");
      const hasAnyNonEmptyText = editedTextValues.some(
        (t) => t.trim().length > 0,
      );
      if (hasOnlyTextParts && !hasAnyNonEmptyText) {
        onCancel();
        return;
      }

      onSave(nextParts);
    } catch (e) {
      logger.error(e);
      onCancel();
    }
  }, [editedTextValues, message.parts, onCancel, onSave]);

  // Render message parts with inline editors for text
  let textIndex = 0;
  return (
    <div
      className={cn(
        "w-full flex flex-col p-2 border border-input rounded-md focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 bg-background",
        className,
      )}
    >
      <div className="flex flex-col">
        {message.parts.map((part, i) => {
          const key =
            "toolCallId" in part && (part as ToolUIPart).toolCallId
              ? (part as ToolUIPart).toolCallId!
              : `${message.id}-${i}`;

          switch (part.type) {
            case "text": {
              const thisIndex = textIndex++;
              return (
                <InlineTextEditor
                  key={key}
                  value={editedTextValues[thisIndex] ?? ""}
                  onChange={(v) => handleTextChange(thisIndex, v)}
                  autoFocus={thisIndex === 0}
                  disableEnter={isMobile}
                  onEnter={!isMobile ? handleSave : undefined}
                  className={cn(thisIndex > 0 ? "mt-1" : "")}
                />
              );
            }
            case "reasoning":
              return <MessagePartReasoning key={key} text={part.text} />;
            case "step-start":
              return <MessagePartStepStart key={key} />;
            case "file":
              return <MessagePartFile key={key} file={part} />;
            default:
              if (part.type.startsWith("tool-")) {
                // Render readonly tool part
                return <MessageToolHandler key={key} part={{ ...part }} />;
              }
              return <MessagePartFallback key={key} {...part} />;
          }
        })}
      </div>

      <div className="flex justify-end items-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="h-6 gap-1 px-1 has-[>svg]:px-1.5"
          onClick={onCancel}
        >
          <XIcon className="size-4" />
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-6 gap-1 px-1 has-[>svg]:px-1.5"
          onClick={handleSave}
        >
          <CheckIcon className="size-4" />
          {message.role === "user" ? "Save & Regenerate" : "Save"}
        </Button>
      </div>
    </div>
  );
};

EditableMessageParts.displayName = "EditableMessageParts";