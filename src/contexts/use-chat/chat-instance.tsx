import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { memo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";

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
    const isInitialized = useRef(false);

    const location = useLocation();
    const navigate = useNavigate();

    const chat = useChat(model, {
      experimental_throttle: settings.EXPERIMENTAL_THROTTLE_ENABLED.value
        ? settings.EXPERIMENTAL_THROTTLE_VALUE.value
        : undefined,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      id: chatId,
      messages: [],
    });

    useEffect(() => {
      const initializeChat = async () => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        // 1. Load existing messages if any
        const chatData = await persistence.loadChat(chatId);
        if (chatData?.messages && chatData.messages.length > 0) {
          chat.setMessages(chatData.messages);
        }

        // 2. Check for and process a pending message (for new chats)
        const pendingState = location.state?.pendingMessage;
        if (pendingState) {
          // Clear location state immediately to prevent re-sending on refresh/re-render
          navigate(location.pathname, { replace: true, state: {} });
          const { message, options } = pendingState;
          // This will correctly add the user's message to the UI first
          await chat.sendMessage(message, options);
        }
      };

      initializeChat();
    }, [chat, chatId, location, navigate, persistence]);

    // Save and generate title logic
    useEffect(() => {
      const saveAndGenerateTitle = async () => {
        // Only run after initialization is complete and there are messages
        if (
          !isInitialized.current ||
          chat.status === "streaming" ||
          chat.messages.length === 0
        ) {
          return;
        }

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
