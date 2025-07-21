import type { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { useContext } from "react";
import {
  ChatFunctionsContext,
  ChatMessagesContext,
  ChatStatusContext,
} from "./chat-contexts";

// Hook types
export type ChatMessagesContextType = Pick<
  UseChatHelpers<UIMessage>,
  "messages"
>;
export type ChatStatusContextType = Pick<
  UseChatHelpers<UIMessage>,
  "status" | "error"
>;
export type ChatFunctionsContextType = Pick<
  UseChatHelpers<UIMessage>,
  "sendMessage" | "addToolResult" | "regenerate" | "resumeStream" | "stop"
>;

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
