import type { ModelConfig } from "@/lib/ai/models";
import { createContext } from "react";
import type {
  ChatFunctionsContextType,
  ChatMessagesContextType,
  ChatStatusContextType,
} from "./chat-hooks";

// Contexts
export const ChatMessagesContext = createContext<
  ChatMessagesContextType | undefined
>(undefined);
export const ChatStatusContext = createContext<
  ChatStatusContextType | undefined
>(undefined);
export const ChatFunctionsContext = createContext<
  ChatFunctionsContextType | undefined
>(undefined);

export interface ChatModelContextType {
  model: ModelConfig;
  setModel: (modelId: string) => void;
}

export const ChatModelContext = createContext<ChatModelContextType | undefined>(
  undefined,
);
