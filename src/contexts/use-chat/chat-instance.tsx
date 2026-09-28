import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import { useAtomValue, useAtomValueRawSync } from "jotai";
import { memo, useCallback, useEffect, useRef } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { getLastTextPart, truncateMessagePreview } from "@/lib/ai/message-preview";
import { generateChatTitle, hasMessageTextContent } from "@/lib/ai/title-generator";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import {
  extractReasoningEnabledAtom,
  notificationSettingAtom,
  throttleValueAtom,
  titleGenerationAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { sendNotificationIfAllowed } from "@/lib/notifications";

const logger = getLogger(import.meta.url);

export type ChatInstanceHelpers = ReturnType<typeof useChat>;

export const ChatInstance = memo(
  ({
    chatId,
    model,
    modelId,
    modelConfig,
    initialMessages,
    onInstanceUpdate,
    onStatusChange,
  }: {
    chatId: string;
    model: LanguageModel;
    modelId: string;
    modelConfig: ModelConfig;
    initialMessages: UIMessage[];
    onInstanceUpdate: (id: string, instance: ChatInstanceHelpers) => void;
    onStatusChange: (
      id: string,
      status: UseChatHelpers<UIMessage>["status"],
      hasError?: boolean,
    ) => void;
  }) => {
    const throttleValue = useAtomValue(throttleValueAtom);
    const titleGenerationSettings = useAtomValue(titleGenerationAtom);
    const extractReasoningEnabled = useAtomValue(extractReasoningEnabledAtom);
    const notificationSetting = useAtomValue(notificationSettingAtom);
    const { loadChatMetadata, saveChat, saveChatTitleState, saveChatTitle } = usePersistence();
    const chatIds = useAtomValueRawSync(chatIdsAtom);
    const suppressAutoSubmitAfterAbortRef = useRef(false);
    const wasBusyRef = useRef(false);
    const notifiedApprovalIdsRef = useRef(new Set<string>());

    const sendAutomaticallyWhen = useCallback(({ messages }: { messages: UIMessage[] }) => {
      if (suppressAutoSubmitAfterAbortRef.current) {
        suppressAutoSubmitAfterAbortRef.current = false;
        return false;
      }

      return lastAssistantMessageIsCompleteWithApprovalResponses({
        messages,
      });
    }, []);

    const chat = useChat(model, modelId, modelConfig, {
      throttle: throttleValue,
      sendAutomaticallyWhen,
      onFinish: ({ isAbort }) => {
        if (isAbort) {
          suppressAutoSubmitAfterAbortRef.current = true;
        }
      },
      id: chatId,
      messages: initialMessages,
    });

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
            !notifiedApprovalIdsRef.current.has(part.approval.id),
        );
      const shouldNotify =
        notificationSetting === "always" ||
        (notificationSetting === "when-unfocused" && !document.hasFocus());

      if (chat.status === "streaming" || chat.status === "submitted") {
        wasBusyRef.current = true;
      }

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
          );
        }
      }

      if (chat.status === "error") {
        if (wasBusyRef.current && shouldNotify) {
          const title = loadChatMetadata(chatId).title;
          void sendNotificationIfAllowed(
            `Error in "${title}"`,
            "AgentOne stopped working because of an error.",
          );
        }
        wasBusyRef.current = false;
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
        );
      }
    }, [chat.status, chat.messages, chatId, loadChatMetadata, notificationSetting]);

    useEffect(() => {
      if (chat.messages.length > 0) {
        if (!chatIds.includes(chatId)) {
          return;
        }

        if (chat.status !== "streaming") {
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
          saveChatTitleState({ chatId, titleState: "generating" });
          generateChatTitle(
            model,
            titleMessages,
            titleGenerationSettings,
            undefined,
            extractReasoningEnabled,
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
      prevProps.initialMessages === nextProps.initialMessages &&
      prevProps.onInstanceUpdate === nextProps.onInstanceUpdate &&
      prevProps.onStatusChange === nextProps.onStatusChange &&
      JSON.stringify(prevProps.modelConfig) === JSON.stringify(nextProps.modelConfig)
    );
  },
);
ChatInstance.displayName = "ChatInstance";
