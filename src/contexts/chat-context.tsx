import { useChat } from "@/hooks/ai/useChat";
import { groq } from "@/lib/ai/providers/groq";
import type { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import type { LanguageModel } from "ai";
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type ChatMessagesContextType = Pick<UseChatHelpers<UIMessage>, "messages">;
type ChatStatusContextType = Pick<
  UseChatHelpers<UIMessage>,
  "status" | "error"
>;
type ChatFunctionsContextType = Pick<
  UseChatHelpers<UIMessage>,
  "sendMessage" | "addToolResult"
>;

const ChatMessagesContext = createContext<ChatMessagesContextType | undefined>(
  undefined,
);
const ChatStatusContext = createContext<ChatStatusContextType | undefined>(
  undefined,
);
const ChatFunctionsContext = createContext<
  ChatFunctionsContextType | undefined
>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  model?: LanguageModel;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  model = groq("qwen/qwen3-32b"),
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
    }),
    [chatResult.sendMessage, chatResult.addToolResult],
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
