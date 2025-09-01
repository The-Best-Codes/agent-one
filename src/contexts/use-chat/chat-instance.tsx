import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { memo, useEffect, useMemo } from "react";

import { useChat } from "@/hooks/ai/useChat";
import {
  loadChat,
  loadChatData,
  saveChat,
  saveChatTitle,
  saveChatTitleState,
} from "@/lib/ai/persistence";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

/**
 * A renderless component that encapsulates a single `useChat` hook instance.
 * It reports its state up to the MultiChatProvider and handles its own side effects
 * like saving messages and generating titles.
 */
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
    const initialMessages = useMemo(() => loadChat(chatId), [chatId]);

    const chat = useChat(model, {
      experimental_throttle: 250, // TODO: Allow user to configure this
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls, // TODO: Investigate this more as a "stop when done with tool" option. You can set this to true or false.
      id: chatId,
      messages: initialMessages,
    });

    // Effect to save chat history and generate titles
    useEffect(() => {
      if (chat.status !== "streaming" && chat.messages.length > 0) {
        saveChat({ chatId, messages: chat.messages });
        const chatData = loadChatData(chatId);
        const hasUserMessage = chat.messages.some((m) => m.role === "user");
        if (hasUserMessage && !chatData.titleState) {
          saveChatTitleState({ chatId, titleState: "generating" });
          generateChatTitle(model, chat.messages)
            .then((generatedTitle) =>
              saveChatTitle({ chatId, title: generatedTitle }),
            )
            .catch((error) => {
              logger.error("Failed to generate title for chat:", chatId, error);
              saveChatTitleState({ chatId, titleState: "error" });
            });
        }
      }
    }, [chat.messages, chat.status, chatId, model]);

    // Report status changes to the parent provider
    useEffect(() => {
      onStatusChange(chatId, chat.status);
    }, [chatId, chat.status, onStatusChange]);

    // This effect syncs the latest chat state to the parent provider's ref.
    // It runs on every render of ChatInstance. This is intentional and cheap,
    // as ChatInstance is renderless. The parent provider will then decide
    // whether a UI re-render is necessary based on focus.
    useEffect(() => {
      onInstanceUpdate(chatId, chat);
    });

    return null;
  },
);
ChatInstance.displayName = "ChatInstance";
