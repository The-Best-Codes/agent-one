import { useModel } from "@/contexts/use-model/model-hooks";
import {
  createChat,
  loadChatData,
  saveChat,
  saveChatTitle,
  saveChatTitleState,
} from "@/lib/ai/persistence";
import { streamRegistry } from "@/lib/ai/stream-registry";
import { generateChatTitle } from "@/lib/ai/title-generator";
import { getLogger } from "@/lib/logger";
import { type UIMessage } from "ai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";
import { useMultiChat } from "./multi-chat-context";
import {
  type ChatStatusContextType,
  type ChatFunctionsContextType,
} from "./chat-hooks";

const logger = getLogger(import.meta.url);

interface ChatProviderProps {
  children: ReactNode;
  chatId: string | undefined;
  initialMessages: UIMessage[];
}

const emptyStatus: ChatStatusContextType = {
  status: "ready",
  error: undefined,
};

const emptyFunctions: ChatFunctionsContextType = {
  sendMessage: async () => {},
  addToolResult: () => {},
  regenerate: async () => {},
  resumeStream: async () => {},
  stop: () => {},
  setMessages: () => {},
};

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatId,
  initialMessages,
}) => {
  const { currentModel } = useModel();
  const navigate = useNavigate();
  const location = useLocation();
  const { getChat, createChat: createManagedChat } = useMultiChat();

  const model = useMemo(() => currentModel.model, [currentModel.model]);

  useEffect(() => {
    if (chatId) {
      createManagedChat(chatId, initialMessages);
    }
  }, [chatId, initialMessages, createManagedChat]);

  const chatInstance = chatId ? getChat(chatId) : undefined;

  const {
    messages = initialMessages,
    status = "ready",
    error,
    sendMessage,
    addToolResult,
    regenerate,
    resumeStream,
    stop,
    setMessages,
  } = chatInstance || {};

  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (chatId && status !== "streaming" && messages.length > 0) {
      try {
        saveChat({ chatId, messages });

        const chatData = loadChatData(chatId);
        const hasUserMessage = messages.some((m) => m.role === "user");

        if (hasUserMessage && !chatData.titleState) {
          saveChatTitleState({ chatId, titleState: "generating" });
          generateChatTitle(model, messages)
            .then((generatedTitle) => {
              saveChatTitle({ chatId, title: generatedTitle });
            })
            .catch((error) => {
              logger.error("Failed to generate title for chat:", chatId, error);
              saveChatTitleState({ chatId, titleState: "error" });
            });
        }
      } catch (error) {
        logger.error("Failed to save chat or generate title:", chatId, error);
      }
    }
  }, [messages, status, chatId, model]);

  useEffect(() => {
    const pendingState = location.state?.pendingMessage;
    if (pendingState && status === "ready" && sendMessage) {
      navigate(location.pathname, { replace: true, state: {} });
      const { message, options } = pendingState;
      sendMessage(message, options);
    }
  }, [location.state, location.pathname, navigate, status, sendMessage]);

  useEffect(() => {
    if (chatId && stop) {
      streamRegistry.register(chatId, stop);
      return () => {
        streamRegistry.unregister(chatId);
      };
    }
  }, [chatId, stop]);

  const sendMessageWrapper = useCallback(
    (
      message: Parameters<typeof sendMessage>[0],
      options?: Parameters<typeof sendMessage>[1],
    ): Promise<void> => {
      if (chatId && sendMessage) {
        return sendMessage(message, options);
      }

      const newChatId = createChat();

      navigate(`/chat/${newChatId}`, {
        replace: true,
        state: { pendingMessage: { message, options } },
      });

      return Promise.resolve();
    },
    [chatId, navigate, sendMessage],
  );

  const statusValue = useMemo(
    () => (chatInstance ? { status, error } : emptyStatus),
    [chatInstance, status, error],
  );

  const functionsValue = useMemo(
    () =>
      chatInstance
        ? {
            sendMessage: sendMessageWrapper,
            addToolResult,
            regenerate,
            resumeStream,
            stop,
            setMessages,
          }
        : { ...emptyFunctions, sendMessage: sendMessageWrapper },
    [
      chatInstance,
      sendMessageWrapper,
      addToolResult,
      regenerate,
      resumeStream,
      stop,
      setMessages,
    ],
  );

  return (
    <ChatMessagesContext.Provider value={messages}>
      <ChatStatusContext.Provider value={statusValue}>
        <ChatFunctionsContext.Provider value={functionsValue}>
          {children}
        </ChatFunctionsContext.Provider>
      </ChatStatusContext.Provider>
    </ChatMessagesContext.Provider>
  );
};
