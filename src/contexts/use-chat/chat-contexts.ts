import { createContext } from "react";

import type {
  ChatFunctionsContextType,
  ChatMessagesContextType,
  ChatMetadataContextType,
  ChatStatusContextType,
} from "./chat-hooks";

// Contexts
export const ChatMessagesContext = createContext<
  ChatMessagesContextType | undefined
>(undefined);
export const ChatStatusContext = createContext<
  ChatStatusContextType | undefined
>(undefined);
export const ChatMetadataContext = createContext<
  ChatMetadataContextType | undefined
>(undefined);
export const ChatLoadingContext = createContext<boolean>(false);
export const ChatFunctionsContext = createContext<
  ChatFunctionsContextType | undefined
>(undefined);
