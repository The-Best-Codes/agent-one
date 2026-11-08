import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
  type UITool,
  type UIToolInvocation,
} from "ai";
import { useAtomValue, useAtomValueRawSync } from "jotai";
import { memo, useCallback, useEffect, useRef } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { isCompactionPart } from "@/lib/ai/compaction";
import { getLastTextPart, truncateMessagePreview } from "@/lib/ai/message-preview";
import {
  generateChatTitle,
  getChatTitleFallback,
  hasMessageTextContent,
} from "@/lib/ai/title-generator";
import { TOOL_CANCELLED_BY_USER_SYMBOL, TOOL_INTERRUPTED_BY_ERROR_TEXT } from "@/lib/constants";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { sendNotificationIfAllowed } from "@/lib/notifications";

const logger = getLogger(import.meta.url);

export type ChatInstanceHelpers = ReturnType<typeof useChat>;

function closeInterruptedParts(
  messages: UIMessage[],
  outcome: "ready" | "error",
): UIMessage[] | null {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role !== "assistant") return null;

  let hasChanges = false;
  const newParts = lastMessage.parts.map((part) => {
    if (
      (part.type.startsWith("tool-") || part.type === "dynamic-tool") &&
      "state" in part &&
      (part.state === "approval-responded" ||
        part.state === "input-streaming" ||
        part.state === "input-available" ||
        (part.state === "output-available" &&
          (part as { preliminary?: boolean }).preliminary === true))
    ) {
      hasChanges = true;
      return {
        ...part,
        state: "output-error",
        errorText:
          outcome === "error" ? TOOL_INTERRUPTED_BY_ERROR_TEXT : TOOL_CANCELLED_BY_USER_SYMBOL,
      } as UIToolInvocation<UITool>;
    }
    return part;
  });
  const cleanedParts = (newParts as UIMessage["parts"]).filter(
    (part) => !isCompactionPart(part) || part.data.status === "done",
  );
  if (cleanedParts.length !== newParts.length) {
    hasChanges = true;
  }

  if (!hasChanges) return null;
  return [...messages.slice(0, -1), { ...lastMessage, parts: cleanedParts }];
}

export const ChatInstance = memo(
  ({
    chatId,
    model,
    modelId,
    providerName,
    modelConfig,
    contextWindow,
    initialMessages,
    onInstanceUpdate,
    onStatusChange,
  }: {
    chatId: string;
    model: LanguageModel;
    modelId: string;
    providerName: string;
    modelConfig: ModelConfig;
    contextWindow: number | undefined;
    initialMessages: UIMessage[];
    onInstanceUpdate: (id: string, instance: ChatInstanceHelpers) => void;
    onStatusChange: (
      id: string,
      status: UseChatHelpers<UIMessage>["status"],
      hasError?: boolean,
    ) => void;
  }) => {
    const throttleValue = useAtomValue(settingAtoms.THROTTLE_VALUE);
    const titleGenerationSettings = useAtomValue(settingAtoms.TITLE_GENERATION);
    const extractReasoningEnabled = useAtomValue(settingAtoms.EXTRACT_REASONING_ENABLED);
    const notificationSetting = useAtomValue(settingAtoms.NOTIFICATION_SETTING);
    const { loadChatMetadata, saveChat, markChatMessageSent, saveChatTitleState, saveChatTitle } =
      usePersistence();
    const chatIds = useAtomValueRawSync(chatIdsAtom);
    const suppressAutoSubmitAfterAbortRef = useRef(false);
    const wasBusyRef = useRef(false);
    const notifiedApprovalIdsRef = useRef(new Set<string>());
    const lastSavedMessagesRef = useRef(initialMessages);

    const sendAutomaticallyWhen = useCallback(({ messages }: { messages: UIMessage[] }) => {
      if (suppressAutoSubmitAfterAbortRef.current) {
        suppressAutoSubmitAfterAbortRef.current = false;
        return false;
      }

      return lastAssistantMessageIsCompleteWithApprovalResponses({
        messages,
      });
    }, []);

    const onUserMessageSent = useCallback(() => {
      suppressAutoSubmitAfterAbortRef.current = false;
      markChatMessageSent(chatId);
    }, [chatId, markChatMessageSent]);

    const chat = useChat(model, modelId, providerName, modelConfig, contextWindow, {
      throttle: throttleValue,
      sendAutomaticallyWhen,
      onUserMessageSent,
      onFinish: ({ isAbort }) => {
        if (isAbort) {
          suppressAutoSubmitAfterAbortRef.current = true;
        }
      },
      id: chatId,
      messages: initialMessages,
    });

    const setChatMessages = chat.setMessages;

    useEffect(() => {
      const pendingApproval = chat.messages
        .filter((message) => message.role === "assistant")
        .flatMap((message) => message.parts)
        .find(
          (part) =>
            (part.type.startsWith("tool-") || part.type === "dynamic-tool") &&
            "state" in part &&
            part.state === "approval-requested" &&
            "approval" in part &&
            part.approval?.id &&
            !part.approval.isAutomatic &&
            !notifiedApprovalIdsRef.current.has(part.approval.id),
        );
      const shouldNotify =
        notificationSetting === "always" ||
        (notificationSetting === "when-unfocused" && !document.hasFocus()) ||
        (notificationSetting === "unless-viewing" &&
          !(document.hasFocus() && window.location.pathname === `/chat/${chatId}`));

      if (chat.status === "streaming" || chat.status === "submitted") {
        wasBusyRef.current = true;
      }

      const finishedRun =
        wasBusyRef.current && (chat.status === "ready" || chat.status === "error");

      if (wasBusyRef.current && chat.status === "ready") {
        wasBusyRef.current = false;
        const lastMessage = chat.messages[chat.messages.length - 1];

        if (shouldNotify && lastMessage?.role === "assistant" && !pendingApproval) {
          const title = loadChatMetadata(chatId).title;
          void sendNotificationIfAllowed(
            `New Message in "${title}"`,
            truncateMessagePreview(
              getLastTextPart(lastMessage) || "Open AgentOne to keep working.",
            ),
            chatId,
          );
        }
      }

      if (chat.status === "error") {
        if (wasBusyRef.current && shouldNotify) {
          const title = loadChatMetadata(chatId).title;
          void sendNotificationIfAllowed(
            `Error in "${title}"`,
            "AgentOne stopped working because of an error.",
            chatId,
          );
        }
        wasBusyRef.current = false;
      }

      if (finishedRun) {
        const closedMessages = closeInterruptedParts(
          chat.messages,
          chat.status === "error" ? "error" : "ready",
        );
        if (closedMessages) {
          setChatMessages(closedMessages);
        }
      }

      if (
        pendingApproval &&
        "approval" in pendingApproval &&
        pendingApproval.approval?.id &&
        shouldNotify
      ) {
        notifiedApprovalIdsRef.current.add(pendingApproval.approval.id);
        const title = loadChatMetadata(chatId).title;
        void sendNotificationIfAllowed(
          `Approval Required in "${title}"`,
          "AgentOne can't continue until you provide approval.",
          chatId,
        );
      }
    }, [
      chat.status,
      chat.messages,
      setChatMessages,
      chatId,
      loadChatMetadata,
      notificationSetting,
    ]);

    useEffect(() => {
      if (chat.messages.length > 0) {
        if (!chatIds.includes(chatId)) {
          return;
        }

        if (chat.status !== "streaming" && chat.messages !== lastSavedMessagesRef.current) {
          lastSavedMessagesRef.current = chat.messages;
          saveChat({ chatId, messages: chat.messages });
        }

        const chatMetadata = loadChatMetadata(chatId);
        const titleMessages = chat.messages.filter(
          (m) => (m.role === "user" || m.role === "assistant") && hasMessageTextContent(m),
        );
        const hasUserMessage = titleMessages.some((m) => m.role === "user");
        const needsAssistantMessage =
          titleGenerationSettings.method === "first-assistant-message" &&
          !titleMessages.some((m) => m.role === "assistant");

        if (hasUserMessage && !chatMetadata.titleState && !needsAssistantMessage) {
          logger.verbose(
            `Triggering title generation for chat ${chatId} with ${chat.messages.length} messages`,
          );
          saveChatTitleState({
            chatId,
            titleState: "generating",
            title:
              titleGenerationSettings.method === "ai"
                ? getChatTitleFallback(titleMessages, titleGenerationSettings)
                : undefined,
          });
          generateChatTitle(
            model,
            titleMessages,
            titleGenerationSettings,
            undefined,
            extractReasoningEnabled,
            chatId,
          )
            .then((generatedTitle) => {
              if (chatIds.includes(chatId)) {
                saveChatTitle({ chatId, title: generatedTitle });
              }
            })
            .catch((error) => {
              logger.error("Failed to generate title for chat:", chatId, error);
              if (chatIds.includes(chatId)) {
                saveChatTitleState({ chatId, titleState: "error" });
              }
            });
        }
      }
    }, [
      chat.messages,
      chat.status,
      chatId,
      model,
      chatIds,
      extractReasoningEnabled,
      loadChatMetadata,
      saveChat,
      saveChatTitle,
      saveChatTitleState,
      titleGenerationSettings,
    ]);

    useEffect(() => {
      onStatusChange(chatId, chat.status, !!chat.error);
    }, [chatId, chat.status, chat.error, onStatusChange]);

    useEffect(() => {
      onInstanceUpdate(chatId, chat);
      // TODO: Address this later?
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, chat.status, chat.messages, chat.sendMessage, chat.regenerate, onInstanceUpdate]);

    return null;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.chatId === nextProps.chatId &&
      prevProps.model === nextProps.model &&
      prevProps.modelId === nextProps.modelId &&
      prevProps.providerName === nextProps.providerName &&
      prevProps.contextWindow === nextProps.contextWindow &&
      prevProps.initialMessages === nextProps.initialMessages &&
      prevProps.onInstanceUpdate === nextProps.onInstanceUpdate &&
      prevProps.onStatusChange === nextProps.onStatusChange &&
      JSON.stringify(prevProps.modelConfig) === JSON.stringify(nextProps.modelConfig)
    );
  },
);
ChatInstance.displayName = "ChatInstance";
