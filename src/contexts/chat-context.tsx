import { useChat } from "@/hooks/ai/useChat";
import { google } from "@/lib/ai/providers/google";
import type { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import type { LanguageModel } from "ai";
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type ChatContextType = Pick<
  UseChatHelpers<UIMessage>,
  "messages" | "sendMessage" | "error" | "status"
>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  model?: LanguageModel;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  model = google("gemini-2.0-flash"),
}) => {
  const chatResult = useChat(model);

  const contextValue = useMemo(
    () => ({
      messages: chatResult.messages,
      sendMessage: chatResult.sendMessage,
      error: chatResult.error,
      status: chatResult.status,
    }),
    [
      chatResult.messages,
      chatResult.sendMessage,
      chatResult.error,
      chatResult.status,
    ],
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
