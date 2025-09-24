import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { memo, useEffect, useRef } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useSettings } from "@/contexts/use-settings/settings-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export const ChatInstance = memo(
  ({
    chatId,
    model,
    onInstanceUpdate,
    onStatusChange,
  }: {
    chatId: string;
    model: LanguageModel;
    onInstanceUpdate: (id: string, instance: UseChatHelpers<UIMessage>) => void;
    onStatusChange: (
      id: string,
      status: UseChatHelpers<UIMessage>["status"],
    ) => void;
  }) => {
    const { settings } = useSettings();
    const persistence = usePersistence();
    const isLoadedRef = useRef(false);

    const chat = useChat(model, {
      experimental_throttle: settings.EXPERIMENTAL_THROTTLE_ENABLED.value
        ? settings.EXPERIMENTAL_THROTTLE_VALUE.value
        : undefined,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      id: chatId,
      messages: [], // Start with empty, load from persistence
    });

    useEffect(() => {
      const loadInitialMessages = async () => {
        if (!isLoadedRef.current) {
          const chatData = await persistence.loadChat(chatId);
          if (chatData?.messages) {
            isLoadedRef.current = true;
            chat.setMessages(chatData.messages);
          }
        }
      };
      loadInitialMessages();
    }, [chatId, persistence, chat]);

    useEffect(() => {
      const saveAndGenerateTitle = async () => {
        if (
          chat.status !== "streaming" &&
          chat.messages.length > 0 &&
          isLoadedRef.current
        ) {
          await persistence.saveChat({ id: chatId, messages: chat.messages });
          const chatData = await persistence.loadChat(chatId);
          const hasUserMessage = chat.messages.some((m) => m.role === "user");

          if (hasUserMessage && !chatData?.titleState) {
            await persistence.saveChatTitleState(chatId, "generating");
            try {
              const generatedTitle = await generateChatTitle(
                model,
                chat.messages,
              );
              await persistence.updateChatTitle(chatId, generatedTitle);
            } catch (error) {
              logger.error("Failed to generate title for chat:", chatId, error);
              await persistence.saveChatTitleState(chatId, "error");
            }
          }
        }
      };
      saveAndGenerateTitle();
    }, [chat.messages, chat.status, chatId, model, persistence]);

    useEffect(() => {
      onStatusChange(chatId, chat.status);
    }, [chatId, chat.status, onStatusChange]);

    useEffect(() => {
      onInstanceUpdate(chatId, chat);
    });

    return null;
  },
);
ChatInstance.displayName = "ChatInstance";
