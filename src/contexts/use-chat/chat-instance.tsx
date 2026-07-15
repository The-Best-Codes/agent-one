import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
} from "ai";
import { useAtomValue } from "jotai";
import { memo, useCallback, useEffect, useRef } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { generateChatTitle, hasMessageTextContent } from "@/lib/ai/title-generator";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import {
  extractReasoningEnabledAtom,
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
  titleGenerationAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

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
    onInstanceUpdate: (id: string, instance: UseChatHelpers<UIMessage>) => void;
    onStatusChange: (
      id: string,
      status: UseChatHelpers<UIMessage>["status"],
      hasError?: boolean,
    ) => void;
  }) => {
    const experimentalThrottleEnabled = useAtomValue(experimentalThrottleEnabledAtom);
    const experimentalThrottleValue = useAtomValue(experimentalThrottleValueAtom);
    const titleGenerationSettings = useAtomValue(titleGenerationAtom);
    const extractReasoningEnabled = useAtomValue(extractReasoningEnabledAtom);
    const { loadChatMetadata, saveChat, saveChatTitleState, saveChatTitle } = usePersistence();
    const chatIds = useAtomValue(chatIdsAtom);
    const suppressAutoSubmitAfterAbortRef = useRef(false);

    const sendAutomaticallyWhen = useCallback(({ messages }: { messages: UIMessage[] }) => {
      if (suppressAutoSubmitAfterAbortRef.current) {
        suppressAutoSubmitAfterAbortRef.current = false;
        return false;
      }

      return lastAssistantMessageIsCompleteWithApprovalResponses({ messages });
    }, []);

    const chat = useChat(model, modelId, modelConfig, {
      experimental_throttle: experimentalThrottleEnabled ? experimentalThrottleValue : undefined,
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
