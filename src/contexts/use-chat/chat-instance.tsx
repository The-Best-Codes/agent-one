import { type UseChatHelpers } from "@ai-sdk/react";
import {
  type LanguageModel,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useLiveQuery } from "dexie-react-hooks";
import { useAtomValue } from "jotai";
import { memo, useEffect } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useChat } from "@/hooks/ai/use-chat";
import { type ModelConfig } from "@/lib/ai/models";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { type ChatRecord, db } from "@/lib/db";
import {
  experimentalThrottleEnabledAtom,
  experimentalThrottleValueAtom,
} from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

// Inner component handles the actual chat logic once data is available
const ChatInstanceInner = ({
  chatId,
  model,
  modelConfig,
  chatRecord,
  onInstanceUpdate,
  onStatusChange,
}: {
  chatId: string;
  model: LanguageModel;
  modelConfig: ModelConfig;
  chatRecord: ChatRecord;
  onInstanceUpdate: (id: string, instance: UseChatHelpers<UIMessage>) => void;
  onStatusChange: (
    id: string,
    status: UseChatHelpers<UIMessage>["status"],
  ) => void;
}) => {
  const experimentalThrottleEnabled = useAtomValue(
    experimentalThrottleEnabledAtom,
  );
  const experimentalThrottleValue = useAtomValue(experimentalThrottleValueAtom);
  const { saveChat, saveChatTitleState, saveChatTitle } = usePersistence();

  const chat = useChat(model, modelConfig, {
    experimental_throttle: experimentalThrottleEnabled
      ? experimentalThrottleValue
      : undefined,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    id: chatId,
    messages: chatRecord.messages,
  });

  useEffect(() => {
    if (chat.messages.length > 0) {
      if (chat.status !== "streaming") {
        saveChat({ chatId, messages: chat.messages });
      }

      const hasUserMessage = chat.messages.some((m) => m.role === "user");
      if (hasUserMessage && !chatRecord.titleState) {
        logger.verbose(
          `Triggering title generation for chat ${chatId} with ${chat.messages.length} messages`,
        );
        // Save the generating state to prevent duplicate generation
        saveChatTitleState({ chatId, titleState: "generating" });
        generateChatTitle(model, chat.messages)
          .then((generatedTitle) => {
            saveChatTitle({ chatId, title: generatedTitle });
          })
          .catch((error) => {
            logger.error("Failed to generate title for chat:", chatId, error);
            saveChatTitleState({ chatId, titleState: "error" });
          });
      }
    }
  }, [
    chat.messages,
    chat.status,
    chatId,
    model,
    chatRecord.titleState, // Depend on titleState from record
    saveChat,
    saveChatTitle,
    saveChatTitleState,
  ]);

  useEffect(() => {
    onStatusChange(chatId, chat.status);
  }, [chatId, chat.status, onStatusChange]);

  useEffect(() => {
    onInstanceUpdate(chatId, chat);
    // Cleanup on unmount
    return () => {
      // We might want to deregister, but MultiChatProvider handles map cleanup mostly.
      // Explicit deregistration can be safer:
      // onInstanceUpdate(chatId, null as unknown as UseChatHelpers<UIMessage>);
    };
  }, [chatId, chat, onInstanceUpdate]);

  return null;
};

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
    // Reactive read from DB
    const chatRecord = useLiveQuery(() => db.chats.get(chatId), [chatId]);

    // Don't render inner logic until we have the data.
    // This prevents useChat from initializing with empty messages.
    if (!chatRecord) return null;

    return (
      <ChatInstanceInner
        chatId={chatId}
        model={model}
        modelConfig={modelConfig}
        chatRecord={chatRecord}
        onInstanceUpdate={onInstanceUpdate}
        onStatusChange={onStatusChange}
      />
    );
  },
  (prevProps, nextProps) => {
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
