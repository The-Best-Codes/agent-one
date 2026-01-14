import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useAtomValue } from "jotai";
import { memo, useEffect, useMemo } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { chatIdsAtom } from "@/lib/jotai/atoms";
import {
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export const ChatInstance = memo(
  ({
    chatId,
    model,
    modelConfig,
    onInstanceUpdate,
    onStatusChange,
  }: {
    chatId: string;
    model: LanguageModel;
    modelConfig: ModelConfig;
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
    const {
      loadChat,
      loadChatData,
      saveChat,
      saveChatTitleState,
      saveChatTitle,
    } = usePersistence();
    const chatIds = useAtomValue(chatIdsAtom);
    const initialMessages = useMemo(() => loadChat(chatId), [chatId, loadChat]);

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

        const chatData = loadChatData(chatId);
        const hasUserMessage = chat.messages.some((m) => m.role === "user");
        if (hasUserMessage && !chatData.titleState) {
          logger.verbose(
            `Triggering title generation for chat ${chatId} with ${chat.messages.length} messages`,
          );
          // TODO: We need to make this state in-memory if we migrate to an async DB, otherwise rerenders, new messages, etc. will trigger title generation again
          saveChatTitleState({ chatId, titleState: "generating" });
          generateChatTitle(model, chat.messages)
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
      loadChatData,
      saveChat,
      saveChatTitle,
      saveChatTitleState,
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
    // TODO: This (the JSON.stringify calls at the end) may be inefficient with future architecture changes, keep an eye on it
    // Custom comparison to prevent re-renders when modelConfig object reference changes
    // but the content is the same (which happens because of JSON.parse in persistence).
    return (
      prevProps.chatId === nextProps.chatId &&
      prevProps.model === nextProps.model &&
      prevProps.onInstanceUpdate === nextProps.onInstanceUpdate &&
      prevProps.onStatusChange === nextProps.onStatusChange &&
      JSON.stringify(prevProps.modelConfig) ===
        JSON.stringify(nextProps.modelConfig)
    );
  },
);
ChatInstance.displayName = "ChatInstance";
