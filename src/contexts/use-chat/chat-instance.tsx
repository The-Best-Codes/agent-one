import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useAtomValue } from "jotai";
import { memo, useEffect, useMemo } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { type ModelConfig } from "@/lib/ai/models";
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
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
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
      onStatusChange(chatId, chat.status);
    }, [chatId, chat.status, onStatusChange]);

    useEffect(() => {
      onInstanceUpdate(chatId, chat);
    }, [chatId, chat, onInstanceUpdate]);

    return null;
  },
  (prevProps, nextProps) => {
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
