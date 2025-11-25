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

    const chat = useChat(model, {
      experimental_throttle: experimentalThrottleEnabled
        ? experimentalThrottleValue
        : undefined,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls, // TODO: Investigate this more as a "stop when done with tool" option. You can set this to true or false.
      id: chatId,
      messages: initialMessages,
    });

    useEffect(() => {
      if (chat.status !== "streaming" && chat.messages.length > 0) {
        if (!chatIds.includes(chatId)) {
          return;
        }

        if (!chatIds.includes(chatId)) {
          return;
        }

        saveChat({ chatId, messages: chat.messages });
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
      onStatusChange(chatId, chat.status);
    }, [chatId, chat.status, onStatusChange]);

    useEffect(() => {
      onInstanceUpdate(chatId, chat);
    });

    return null;
  },
);
ChatInstance.displayName = "ChatInstance";
