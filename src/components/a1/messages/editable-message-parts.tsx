"use client";
import { Button } from "@/components/ui/button";
import useMobileDetection from "@/hooks/use-mobile-detection";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type { TextUIPart, ToolUIPart, UIMessage } from "ai";
import { CheckIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { InlineTextEditor } from "./inline-text-editor";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartFile } from "./parts/file";
import { MessagePartReasoning } from "./parts/reasoning";
import { MessagePartStepStart } from "./parts/step-start";
import { MessageToolHandler } from "./tool-handler";

const logger = getLogger(import.meta.url);

interface EditableMessagePartsProps {
  message: UIMessage;
  onCancel: () => void;
  onSave: (updatedParts: UIMessage["parts"]) => void;
  className?: string;
}

export const EditableMessageParts = ({
  message,
  onCancel,
  onSave,
  className,
}: EditableMessagePartsProps) => {
  const initialValues = useMemo(() => {
    return message.parts
      .filter((p): p is TextUIPart => p.type === "text")
      .map((p) => p.text);
  }, [message.parts]);

  const textValuesRef = useRef<string[]>(initialValues);

  const editorRefs = useRef<(HTMLDivElement | null)[]>([]);
  editorRefs.current.length = initialValues.length;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const isMobile = useMobileDetection({
    anyHover: true,
    pointerCoarse: true,
    match: "all",
  });

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
        onCancel();
        return;
      }

      onSave(nextParts);
    } catch (e) {
      logger.error(e);
      onCancel();
    }
  }, [message.parts, onCancel, onSave]);

  useEffect(() => {
    if (initialValues.length === 0) return;
    const lastIdx = initialValues.length - 1;
    const id = window.setTimeout(() => {
      const el = editorRefs.current[lastIdx];
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialValues.length]);

  let textIndex = 0;
  return (
    <div
      ref={containerRef}
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
              const lastTextIndex =
                initialValues.length > 0 ? initialValues.length - 1 : -1;
              return (
                <div
                  key={key}
                  ref={(el) => {
                    editorRefs.current[thisIndex] = el;
                  }}
                >
                  <InlineTextEditor
                    value={textValuesRef.current[thisIndex] ?? ""}
                    onChange={(v) => handleTextChange(thisIndex, v)}
                    autoFocus={thisIndex === lastTextIndex}
                    disableEnter={isMobile}
                    onEnter={!isMobile ? handleSave : undefined}
                    onCancel={onCancel}
                    className={cn(thisIndex > 0 ? "mt-1" : "")}
                  />
                </div>
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
