import { useModel } from "@/contexts/use-model/model-hooks";
import { useChat } from "@/hooks/ai/useChat";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import React, { useMemo, type ReactNode } from "react";
import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { currentModel } = useModel();

  const model = useMemo(() => currentModel.model, [currentModel.model]);

  // https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0#usechat-changes
  const chatResult = useChat(model, {
    experimental_throttle: 250, // TODO: Allow customizing this in settings
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls, // Interesting note: true/false works here. Use for stop button?
  });

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
