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

// Hook types
type ChatMessagesContextType = Pick<UseChatHelpers<UIMessage>, "messages">;
type ChatStatusContextType = Pick<
  UseChatHelpers<UIMessage>,
  "status" | "error"
>;
type ChatFunctionsContextType = Pick<
  UseChatHelpers<UIMessage>,
  "sendMessage" | "addToolResult" | "regenerate" | "resumeStream" | "stop"
>;

// Contexts
const ChatMessagesContext = createContext<ChatMessagesContextType | undefined>(
  undefined,
);
const ChatStatusContext = createContext<ChatStatusContextType | undefined>(
  undefined,
);
const ChatFunctionsContext = createContext<
  ChatFunctionsContextType | undefined
>(undefined);

// Main provider type
interface ChatProviderProps {
  children: ReactNode;
  model?: LanguageModel;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  model = google("gemini-2.0-flashe"), // Revert to `gemini-2.0-flash` after done testing error handling
}) => {
  const chatResult = useChat(model, {
    //experimental_throttle: 250, // TODO: Allow customizing this in settings
  });

  const messagesValue = useMemo(
    () => ({
      messages: chatResult.messages,
    }),
    [chatResult.messages],
  );

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
    }),
    [
      chatResult.sendMessage,
      chatResult.addToolResult,
      chatResult.regenerate,
      chatResult.resumeStream,
      chatResult.stop,
    ],
  );

  return (
    <ChatMessagesContext.Provider value={messagesValue}>
      <ChatStatusContext.Provider value={statusValue}>
        <ChatFunctionsContext.Provider value={functionsValue}>
          {children}
        </ChatFunctionsContext.Provider>
      </ChatStatusContext.Provider>
    </ChatMessagesContext.Provider>
  );
};

export const useChatMessages = (): ChatMessagesContextType => {
  const context = useContext(ChatMessagesContext);
  if (context === undefined) {
    throw new Error("useChatMessages must be used within a ChatProvider");
  }
  return context;
};

export const useChatStatus = (): ChatStatusContextType => {
  const context = useContext(ChatStatusContext);
  if (context === undefined) {
    throw new Error("useChatStatus must be used within a ChatProvider");
  }
  return context;
};

export const useChatFunctions = (): ChatFunctionsContextType => {
  const context = useContext(ChatFunctionsContext);
  if (context === undefined) {
    throw new Error("useChatFunctions must be used within a ChatProvider");
  }
  return context;
};
