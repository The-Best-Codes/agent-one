import { useModel } from "@/contexts/use-model/model-hooks";
import { useChat } from "@/hooks/ai/useChat";
import {
  createChat,
  loadChat,
  loadChatData,
  saveChat,
  saveChatTitle,
  saveChatTitleState,
} from "@/lib/ai/persistence";
import { streamRegistry } from "@/lib/ai/stream-registry";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { getLogger } from "@/lib/logger";
import { type UseChatHelpers } from "@ai-sdk/react";
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type LanguageModel,
  type UIMessage,
} from "ai";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";

const logger = getLogger(import.meta.url);

interface ChatProviderProps {
  children: ReactNode;
  chatId: string | undefined;
}

const ChatController = memo(
  ({
    chatId,
    model,
    onUpdate,
  }: {
    chatId: string;
    model: LanguageModel;
    onUpdate: (id: string, helpers: UseChatHelpers<UIMessage>) => void;
  }) => {
    const initialMessages = useMemo(() => {
      try {
        return loadChat(chatId);
      } catch (error) {
        logger.error("Failed to load chat:", chatId, error);
        return [];
      }
    }, [chatId]);

    const chatHelpers = useChat(model, {
      experimental_throttle: 250,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      id: chatId,
      messages: initialMessages,
    });

    useEffect(() => {
      streamRegistry.register(chatId, chatHelpers.stop);
      return () => {
        streamRegistry.unregister(chatId);
      };
    }, [chatId, chatHelpers.stop]);

    useEffect(() => {
      onUpdate(chatId, chatHelpers);
    }, [chatId, onUpdate, chatHelpers]);

    useEffect(() => {
      if (
        chatHelpers.status !== "streaming" &&
        chatHelpers.messages.length > 0
      ) {
        try {
          saveChat({ chatId, messages: chatHelpers.messages });

          const chatData = loadChatData(chatId);
          const hasUserMessage = chatHelpers.messages.some(
            (m) => m.role === "user",
          );

          if (hasUserMessage && !chatData.titleState) {
            saveChatTitleState({ chatId, titleState: "generating" });
            generateChatTitle(model, chatHelpers.messages)
              .then((generatedTitle) => {
                saveChatTitle({ chatId, title: generatedTitle });
              })
              .catch((error) => {
                logger.error(
                  "Failed to generate title for chat:",
                  chatId,
                  error,
                );
                saveChatTitleState({ chatId, titleState: "error" });
              });
          }
        } catch (error) {
          logger.error("Failed to save chat or generate title:", chatId, error);
        }
      }
    }, [chatId, chatHelpers.messages, chatHelpers.status, model]);

    return null;
  },
);

ChatController.displayName = "ChatController";

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatId,
}) => {
  const { currentModel } = useModel();
  const navigate = useNavigate();
  const location = useLocation();
  const model = useMemo(() => currentModel.model, [currentModel.model]);

  const [managedChatIds, setManagedChatIds] = useState<Set<string>>(
    chatId ? new Set([chatId]) : new Set(),
  );
  const [chatData, setChatData] = useState<
    Map<string, UseChatHelpers<UIMessage>>
  >(new Map());

  useEffect(() => {
    if (chatId && !managedChatIds.has(chatId)) {
      setManagedChatIds((prev) => new Set(prev).add(chatId));
    }
  }, [chatId, managedChatIds]);

  const handleControllerUpdate = useCallback(
    (id: string, helpers: UseChatHelpers<UIMessage>) => {
      setChatData((prev) => new Map(prev).set(id, helpers));
    },
    [],
  );

  const activeChatData = useMemo(() => {
    if (!chatId) return null;
    return chatData.get(chatId);
  }, [chatId, chatData]);

  useEffect(() => {
    const pendingState = location.state?.pendingMessage;
    if (pendingState && activeChatData?.status === "ready") {
      navigate(location.pathname, { replace: true, state: {} });
      const { message, options } = pendingState;
      activeChatData.sendMessage(message, options);
    }
  }, [location.state, location.pathname, navigate, activeChatData]);

  const sendMessageWrapper = useCallback(
    async (
      message: Parameters<UseChatHelpers<UIMessage>["sendMessage"]>[0],
      options?: Parameters<UseChatHelpers<UIMessage>["sendMessage"]>[1],
    ): Promise<void> => {
      if (chatId) {
        const instance = chatData.get(chatId);
        if (instance) {
          instance.sendMessage(message, options);
          return;
        }
        logger.warn(
          `sendMessageWrapper called for active chat ${chatId}, but no data found.`,
        );
        return;
      }

      const newChatId = createChat();
      setManagedChatIds((prev) => new Set(prev).add(newChatId));
      navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });
    },
    [chatId, chatData, navigate],
  );

  const statusValue = useMemo(
    () => ({
      status: activeChatData?.status || "ready",
      error: activeChatData?.error,
    }),
    [activeChatData?.status, activeChatData?.error],
  );

  const functionsValue = useMemo(
    () => ({
      sendMessage: sendMessageWrapper,
      addToolResult: activeChatData?.addToolResult || (() => Promise.resolve()),
      regenerate: activeChatData?.regenerate || (() => Promise.resolve()),
      resumeStream: activeChatData?.resumeStream || (() => Promise.resolve()),
      stop: activeChatData?.stop
        ? () => Promise.resolve(activeChatData.stop())
        : () => Promise.resolve(),
      setMessages: activeChatData?.setMessages || (() => {}),
    }),
    [sendMessageWrapper, activeChatData],
  );

  return (
    <>
      {Array.from(managedChatIds).map((id) => (
        <ChatController
          key={id}
          chatId={id}
          model={model}
          onUpdate={handleControllerUpdate}
        />
      ))}
      <ChatMessagesContext.Provider value={activeChatData?.messages || []}>
        <ChatStatusContext.Provider value={statusValue}>
          <ChatFunctionsContext.Provider value={functionsValue}>
            {children}
          </ChatFunctionsContext.Provider>
        </ChatStatusContext.Provider>
      </ChatMessagesContext.Provider>
    </>
  );
};
