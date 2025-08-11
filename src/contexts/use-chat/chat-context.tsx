import { useModel } from "@/contexts/use-model/model-hooks";
import { useChat } from "@/hooks/ai/useChat";
import { saveChat } from "@/lib/utils";
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import React, { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";

interface ChatProviderProps {
  children: ReactNode;
  chatId: string;
  initialMessages: UIMessage[];
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  chatId,
  initialMessages,
}) => {
  const { currentModel } = useModel();

  const model = useMemo(() => currentModel.model, [currentModel.model]);

  const chatResult = useChat(model, {
    id: chatId,
    messages: initialMessages,
    experimental_throttle: 250,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (chatResult.status !== "streaming" && chatResult.messages.length > 0) {
      saveChat({ chatId, messages: chatResult.messages });
    }
  }, [chatResult.messages, chatResult.status, chatId]);

  const statusValue = useMemo(
    () => ({
      status: chatResult.status,
      error: chatResult.error,
    }),
    [chatResult.status, chatResult.error],
  );

  const functionsValue = useMemo(
    () => ({
      sendMessage: chatResult.sendMessage,
      addToolResult: chatResult.addToolResult,
      regenerate: chatResult.regenerate,
      resumeStream: chatResult.resumeStream,
      stop: chatResult.stop,
      setMessages: chatResult.setMessages,
    }),
    [
      chatResult.sendMessage,
      chatResult.addToolResult,
      chatResult.regenerate,
      chatResult.resumeStream,
      chatResult.stop,
      chatResult.setMessages,
    ],
  );

  return (
    <ChatMessagesContext.Provider value={chatResult.messages}>
      <ChatStatusContext.Provider value={statusValue}>
        <ChatFunctionsContext.Provider value={functionsValue}>
          {children}
        </ChatFunctionsContext.Provider>
      </ChatStatusContext.Provider>
    </ChatMessagesContext.Provider>
  );
};
