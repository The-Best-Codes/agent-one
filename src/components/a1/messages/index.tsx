import { IconCheck, IconChevronDown, IconX } from "@tabler/icons-react";
import type { TextUIPart, ToolUIPart, UIMessage } from "ai";
import { useAtom } from "jotai";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatMessages } from "@/contexts/use-chat/chat-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useMessageEditing } from "@/hooks/use-message-editing";
import type { ToolDisplayLabels } from "@/lib/ai/tools/describeNextTool";
import { getToolDisplayName } from "@/lib/ai/tools/mcp";
import { regenerateOnSaveAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

// When these imports are updates, check if ./src/components/a1/messages/parts/subagent-transcript.tsx needs to be updated as well!
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

const MessagePartsInternal = ({
  message,
  isLastMessage,
}: {
  message: UIMessage;
  isLastMessage?: boolean;
}) => {
  const { t } = useTranslation();
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
  const { branchChat } = usePersistence();
  const allMessages = useChatMessages();

  const [regenerateOnSave, setRegenerateOnSave] = useAtom(regenerateOnSaveAtom);

  const handleEnterKey = useCallback(() => {
    if (message.role === "user") {
      handleSave(regenerateOnSave);
    } else {
      handleSave(false);
    }
  }, [handleSave, message.role, regenerateOnSave]);

  const handleBranch = useCallback(() => {
    if (!activeChatId) {
      logger.error("Cannot branch a new, unsaved chat.");
      return;
    }
    try {
      const newChatId = branchChat({
        originalChatId: activeChatId,
        branchFromMessageId: message.id,
        messages: allMessages,
      });
      void navigate(`/chat/${newChatId}`);
    } catch (error) {
      logger.error("Failed to branch chat:", error);
    }
  }, [activeChatId, message.id, navigate, branchChat, allMessages]);

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
          return `[Source Document: ${part?.title || "Unnamed document"}, ${part?.filename || "Unnamed file"}]`;
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
    let textIndex = 0;

    // eslint-disable-next-line react-hooks/refs
    return message.parts.map((part, i) => {
      const key =
        "toolCallId" in part && (part as ToolUIPart).toolCallId
          ? (part as ToolUIPart).toolCallId!
          : `${message.id}-${i}`;

      switch (part.type) {
        case "text": {
          const thisIndex = textIndex++;
          if (isEditing) {
            const lastTextIndex = initialValues.length > 0 ? initialValues.length - 1 : -1;
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
                  className={cn(i > 1 || thisIndex > 0 ? "mt-1" : "")}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    handleCancel,
    handleEnterKey,
    handleTextChange,
    initialValues.length,
    isLastMessage,
    isEditing,
    isMobile,
    message.id,
    message.parts,
    message.role,
  ]);

  const content = (
    <>
      {renderedParts}
      <ChatMessageLoading mode="inMessage" messageId={message.id} messageRole={message.role} />
    </>
  );

  if (isEditing) {
    return (
      <div
        className={cn(
          "border-input focus-within:border-ring focus-within:ring-ring/50 bg-background ml-2 flex w-full flex-col rounded-md border p-2 focus-within:ring-[3px]",
          message.role === "assistant" ? "my-2" : "mt-2 max-w-3/4 self-end",
        )}
      >
        <div className="flex flex-col">{renderedParts}</div>

        <div className="mt-2 flex items-center justify-end gap-1.5">
          <Button size="xs" variant="outline" onClick={handleCancel}>
            <IconX data-icon="inline-start" />
            {t("common.cancel")}
          </Button>
          {message.role === "user" ? (
            <ButtonGroup>
              <Button size="xs" variant="default" onClick={() => handleSave(regenerateOnSave)}>
                <IconCheck data-icon="inline-start" />
                {t("common.save")}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon-xs" variant="default" aria-label={t("messages.moreOptions")}>
                    <IconChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto min-w-max">
                  <DropdownMenuCheckboxItem
                    id="regenerate-on-save"
                    checked={regenerateOnSave}
                    onCheckedChange={(checked) => setRegenerateOnSave(checked as boolean)}
                  >
                    {t("messages.regenerateWhenSaved")}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          ) : (
            <Button size="xs" variant="default" onClick={() => handleSave(false)}>
              <IconCheck data-icon="inline-start" />
              {t("common.save")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <MessageGroup
      contentToCopy={getCopyContent()}
      contentToSpeak={getTextToSpeechContent()}
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
