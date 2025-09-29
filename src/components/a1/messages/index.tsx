import type { TextUIPart, ToolUIPart, UIMessage } from "ai";
import { CheckIcon, RotateCwIcon, XIcon } from "lucide-react";
import { memo, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { SplitButton } from "@/components/ui/split-button";
import { useMessageEditing } from "@/hooks/use-message-editing";
import { branchChat } from "@/lib/ai/persistence";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import { ChatMessageLoading } from "../chat-message-loading";
import { MessageGroup } from "./group";
import { InlineTextEditor } from "./inline-text-editor";
import { MessagePartDynamicTool } from "./parts/dynamic-tool";
import { MessagePartFallback } from "./parts/fallback";
import { MessagePartFile } from "./parts/file";
import { MessagePartReasoning } from "./parts/reasoning";
import { MessagePartStepStart } from "./parts/step-start";
import { MessagePartText } from "./parts/text";
import { MessageToolHandler } from "./tool-handler";

const logger = getLogger(import.meta.url);

const MessagePartsInternal = ({ message }: { message: UIMessage }) => {
  const {
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
  } = useMessageEditing({ message });

  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();

  const selectedActionRef = useRef<string>("save");

  const handleSelectedActionChange = useCallback((optionId: string) => {
    selectedActionRef.current = optionId;
  }, []);

  const handleEnterKey = useCallback(() => {
    if (message.role === "user") {
      handleSave(selectedActionRef.current === "save-regenerate");
    } else {
      handleSave(false);
    }
  }, [handleSave, message.role]);

  const handleBranch = useCallback(() => {
    if (!activeChatId) {
      logger.error("Cannot branch a new, unsaved chat.");
      return;
    }
    try {
      const newChatId = branchChat({
        originalChatId: activeChatId,
        branchFromMessageId: message.id,
      });
      navigate(`/chat/${newChatId}`);
    } catch (error) {
      logger.error("Failed to branch chat:", error);
    }
  }, [activeChatId, message.id, navigate]);

  const getCopyContent = useCallback(() => {
    return message.parts
      .map((part) => {
        if (part.type === "text") {
          return (part as TextUIPart).text;
        } else if (part.type === "file") {
          return `[File: ${part.filename || "Unnamed file"}]`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }, [message.parts]);

  const renderedParts = useMemo(() => {
    let textIndex = 0;

    return message.parts.map((part, i) => {
      const key =
        "toolCallId" in part && (part as ToolUIPart).toolCallId
          ? (part as ToolUIPart).toolCallId!
          : `${message.id}-${i}`;

      switch (part.type) {
        case "text": {
          const thisIndex = textIndex++;
          if (isEditing) {
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
                  onEnter={!isMobile ? handleEnterKey : undefined}
                  onCancel={handleCancel}
                  className={cn(thisIndex > 0 ? "mt-1" : "")}
                />
              </div>
            );
          }
          return (
            <MessagePartText
              key={key}
              id={message.id}
              text={part.text}
              messageRole={message.role}
            />
          );
        }
        case "reasoning":
          return <MessagePartReasoning key={key} text={part.text} />;
        case "step-start":
          return <MessagePartStepStart key={key} />;
        case "file":
          return <MessagePartFile key={key} file={part} />;
        case "dynamic-tool":
          return <MessagePartDynamicTool key={key} part={part} />;
        default:
          if (part.type.startsWith("tool-")) {
            return <MessageToolHandler key={key} part={{ ...part }} />; // Using a spread operator to ensure React.memo will get a new instance of part
          }

          logger.error(`Unknown or unhandled message part type: ${part.type}`);
          return <MessagePartFallback key={key} {...part} />;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleCancel,
    handleEnterKey,
    handleTextChange,
    initialValues.length,
    isEditing,
    isMobile,
    message.id,
    message.parts,
    message.role,
  ]);

  const content = (
    <>
      {renderedParts}
      <ChatMessageLoading
        mode="inMessage"
        messageId={message.id}
        messageRole={message.role}
      />
    </>
  );

  if (isEditing) {
    return (
      <div
        className={cn(
          "border-input focus-within:border-ring focus-within:ring-ring/50 bg-background ml-2 flex w-full flex-col rounded-md border p-2 focus-within:ring-[3px]",
        )}
      >
        <div className="flex flex-col">{renderedParts}</div>

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 gap-1 px-1 has-[>svg]:px-1.5"
            onClick={handleCancel}
          >
            <XIcon className="size-4" />
            Cancel
          </Button>
          {message.role === "user" ? (
            <SplitButton
              size="sm"
              className="h-6 gap-1 px-1 has-[>svg]:px-1.5"
              storageKey="message-edit-action"
              onSelectedOptionChange={handleSelectedActionChange}
              options={[
                {
                  id: "save",
                  label: (
                    <>
                      <CheckIcon className="size-4" />
                      Save
                    </>
                  ),
                  onClick: () => handleSave(false),
                },
                {
                  id: "save-regenerate",
                  label: (
                    <>
                      <RotateCwIcon className="size-4" />
                      Save & Regenerate
                    </>
                  ),
                  onClick: () => {
                    handleSave(true);
                  },
                },
              ]}
            />
          ) : (
            <Button
              size="sm"
              variant="default"
              className="h-6 gap-1 px-1 has-[>svg]:px-1.5"
              onClick={() => handleSave(false)}
            >
              <CheckIcon className="size-4" />
              Save
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <MessageGroup
      contentToCopy={getCopyContent()}
      messageRole={message.role}
      messageId={message.id}
      onEdit={canEdit ? handleEdit : undefined}
      onBranch={activeChatId ? handleBranch : undefined}
    >
      {content}
    </MessageGroup>
  );
};

export const MessageParts = memo(MessagePartsInternal);
MessageParts.displayName = "MessageParts";
