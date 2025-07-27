import { useChat } from "@/hooks/ai/useChat";
import { google } from "@/lib/ai/providers/google";
import type { LanguageModel } from "ai";
import React, { useMemo, type ReactNode } from "react";
import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";

interface ChatProviderProps {
  children: ReactNode;
  model?: LanguageModel;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  model = google("gemini-2.5-flash"),
}) => {
  const chatResult = useChat(model, {
    experimental_throttle: 250, // TODO: Allow customizing this in settings
    maxSteps: 50,
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
