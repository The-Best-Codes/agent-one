import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useAtomValue } from "jotai";
import { memo, useEffect } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import {
  generateChatTitle,
  hasMessageTextContent,
} from "@/lib/ai/title-generator";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import {
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
    modelConfig,
    initialMessages,
    onInstanceUpdate,
    onStatusChange,
  }: {
    chatId: string;
    model: LanguageModel;
    modelConfig: ModelConfig;
    initialMessages: UIMessage[];
    onInstanceUpdate: (id: string, instance: UseChatHelpers<UIMessage>) => void;
    onStatusChange: (
      id: string,
      status: UseChatHelpers<UIMessage>["status"],
      hasError?: boolean,
    ) => void;
  }) => {
    const experimentalThrottleEnabled = useAtomValue(
      experimentalThrottleEnabledAtom,
    );
    const experimentalThrottleValue = useAtomValue(
      experimentalThrottleValueAtom,
    );
    const titleGenerationSettings = useAtomValue(titleGenerationAtom);
    const { loadChatMetadata, saveChat, saveChatTitleState, saveChatTitle } =
      usePersistence();
    const chatIds = useAtomValue(chatIdsAtom);

    const chat = useChat(model, modelConfig, {
      experimental_throttle: experimentalThrottleEnabled
        ? experimentalThrottleValue
        : undefined,
      sendAutomaticallyWhen: (messages) =>
        lastAssistantMessageIsCompleteWithToolCalls(messages) ||
        lastAssistantMessageIsCompleteWithApprovalResponses(messages),
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
        const hasUserMessage = chat.messages.some((m) => m.role === "user");
        const needsAssistantMessage =
          titleGenerationSettings.method === "first-assistant-message" &&
          !chat.messages.some(
            (m) => m.role === "assistant" && hasMessageTextContent(m),
          );

        if (
          hasUserMessage &&
          !chatMetadata.titleState &&
          !needsAssistantMessage
        ) {
          logger.verbose(
            `Triggering title generation for chat ${chatId} with ${chat.messages.length} messages`,
          );
          saveChatTitleState({ chatId, titleState: "generating" });
          generateChatTitle(model, chat.messages, titleGenerationSettings)
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
    });

    return null;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.chatId === nextProps.chatId &&
      prevProps.model === nextProps.model &&
      prevProps.initialMessages === nextProps.initialMessages &&
      prevProps.onInstanceUpdate === nextProps.onInstanceUpdate &&
      prevProps.onStatusChange === nextProps.onStatusChange &&
      JSON.stringify(prevProps.modelConfig) ===
        JSON.stringify(nextProps.modelConfig)
    );
  },
);
ChatInstance.displayName = "ChatInstance";
