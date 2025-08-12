import { useModel } from "@/contexts/use-model/model-hooks";
import { useChat } from "@/hooks/ai/useChat";
import { createChat, saveChat } from "@/lib/ai/persistence";
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
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

interface ChatProviderProps {
  children: ReactNode;
  chatId: string | undefined;
  initialMessages: UIMessage[];
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatId,
  initialMessages,
}) => {
  const { currentModel } = useModel();
  const navigate = useNavigate();
  const location = useLocation();

  const model = useMemo(() => currentModel.model, [currentModel.model]);

  // https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0#usechat-changes
  const {
    messages,
    status,
    error,
    sendMessage,
    addToolResult,
    regenerate,
    resumeStream,
    stop,
    setMessages,
  } = useChat(model, {
    experimental_throttle: 250, // TODO: Allow customizing this in settings
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls, // Interesting note: true/false works here. Use for stop button?
    id: chatId,
    messages: initialMessages,
  });

  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    if (chatId && status !== "streaming" && messages.length > 0) {
      saveChat({ chatId, messages });
    }
  }, [messages, status, chatId]);

  useEffect(() => {
    const pendingState = location.state?.pendingMessage;
    if (pendingState && status === "ready") {
      navigate(location.pathname, { replace: true, state: {} });
      const { message, options } = pendingState;
      sendMessage(message, options);
    }
  }, [location.state, location.pathname, navigate, status, sendMessage]);

  const sendMessageWrapper = useCallback(
    (
      message: Parameters<typeof sendMessage>[0],
      options?: Parameters<typeof sendMessage>[1],
    ): Promise<void> => {
      if (chatId) {
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

  const statusValue = useMemo(() => ({ status, error }), [status, error]);

  const functionsValue = useMemo(
    () => ({
      sendMessage: sendMessageWrapper,
      addToolResult,
      regenerate,
      resumeStream,
      stop,
      setMessages,
    }),
    [
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
