import type { UIMessage, UseChatHelpers } from "@ai-sdk/react";
import { useContext } from "react";

import type { ChatMetadata } from "@/contexts/use-persistence/persistence-context";

import {
  ChatApprovalHandlerContext,
  ChatFunctionsContext,
  ChatLoadingContext,
  ChatMessagesContext,
  ChatMetadataContext,
  ChatStatusContext,
} from "./chat-contexts";

// Hook types
export type ChatMessagesContextType = UIMessage[];
export type ChatStatusContextType = Pick<UseChatHelpers<UIMessage>, "status" | "error">;
export type ChatMetadataContextType = ChatMetadata;
export type ChatFunctionsContextType = Pick<
  UseChatHelpers<UIMessage>,
  | "sendMessage"
  | "addToolOutput"
  | "addToolApprovalResponse"
  | "regenerate"
  | "clearError"
  | "resumeStream"
  | "stop"
  | "setMessages"
> & {
  updateMcpAppModelContext: (viewId: string, context: unknown) => void;
};

export type ChatApprovalHandler = (args: {
  id: string;
  approved: boolean;
  reason?: string;
}) => Promise<void>;

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

export const useChatLoading = (): boolean => {
  return useContext(ChatLoadingContext);
};

export const useChatMetadata = (): ChatMetadataContextType => {
  const context = useContext(ChatMetadataContext);
  if (context === undefined) {
    throw new Error("useChatMetadata must be used within a ChatProvider");
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

export const useChatApprovalHandler = (): ChatApprovalHandler | undefined => {
  return useContext(ChatApprovalHandlerContext);
};
