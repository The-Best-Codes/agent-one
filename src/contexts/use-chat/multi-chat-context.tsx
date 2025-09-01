import { useModel } from "@/contexts/use-model/model-hooks";
import { useChat } from "@/hooks/ai/useChat";
import { loadChat } from "@/lib/ai/persistence";
import { getLogger } from "@/lib/logger";
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";

const logger = getLogger(import.meta.url);

// The state for a single chat instance
export type ChatInstance = UseChatHelpers<UIMessage>;

// The context value
interface MultiChatContextType {
  getChat: (chatId: string) => ChatInstance | undefined;
  createChat: (chatId: string, initialMessages: UIMessage[]) => void;
  unloadChat: (chatId: string) => void;
  currentChatId: string | undefined;
}

const MultiChatContext = createContext<MultiChatContextType | undefined>(
  undefined,
);

// Hook to access the multi-chat context
export const useMultiChat = () => {
  const context = useContext(MultiChatContext);
  if (!context) {
    throw new Error("useMultiChat must be used within a MultiChatProvider");
  }
  return context;
};

// Headless component that manages a single chat instance
const ChatInstanceComponent: React.FC<{
  chatId: string;
  initialMessages: UIMessage[];
  onUpdate: (chatId: string, newInstance: ChatInstance) => void;
  onUnload: (chatId: string) => void;
  isFocused: boolean;
}> = ({ chatId, initialMessages, onUpdate, onUnload, isFocused }) => {
  const { currentModel } = useModel();
  const chat = useChat(currentModel.model, {
    experimental_throttle: 250,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    id: chatId,
    messages: initialMessages,
  });

  useEffect(() => {
    onUpdate(chatId, chat);
  }, [chat, chatId, onUpdate]);

  useEffect(() => {
    // Unload logic
    if (!isFocused && chat.status !== "streaming" && chat.status !== "submitted") {
      logger.verbose(`Unloading chat ${chatId}`);
      onUnload(chatId);
    }
  }, [isFocused, chat.status, chatId, onUnload]);


  return null; // This is a headless component
};

// Provider to manage all chat instances
export const MultiChatProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [chats, setChats] = useState<Record<string, ChatInstance>>({});
  const [managedChatIds, setManagedChatIds] = useState<
    Record<string, UIMessage[]>
  >({});
  const location = useLocation();
  const currentChatId = useMemo(() => {
    const match = location.pathname.match(/\/chat\/(c_[^/]+)/);
    return match?.[1];
  }, [location.pathname]);

  const handleUpdate = useCallback(
    (chatId: string, newInstance: ChatInstance) => {
      setChats((prev) => ({ ...prev, [chatId]: newInstance }));
    },
    [],
  );

  const handleUnload = useCallback((chatId: string) => {
    setChats((prev) => {
      const newChats = { ...prev };
      delete newChats[chatId];
      return newChats;
    });
    setManagedChatIds((prev) => {
        const newIds = { ...prev };
        delete newIds[chatId];
        return newIds;
      });
  }, []);

  const getChat = useCallback(
    (chatId: string) => {
      return chats[chatId];
    },
    [chats],
  );

  const createChat = useCallback(
    (chatId: string, initialMessages: UIMessage[]) => {
      if (!managedChatIds[chatId]) {
        logger.verbose(`Creating new managed chat: ${chatId}`);
        setManagedChatIds((prev) => ({ ...prev, [chatId]: initialMessages }));
      }
    },
    [managedChatIds],
  );

  const contextValue = useMemo(
    () => ({
      getChat,
      createChat,
      unloadChat: handleUnload,
      currentChatId,
    }),
    [getChat, createChat, handleUnload, currentChatId],
  );

  return (
    <MultiChatContext.Provider value={contextValue}>
      {Object.entries(managedChatIds).map(([id, initialMessages]) => (
        <ChatInstanceComponent
          key={id}
          chatId={id}
          initialMessages={initialMessages}
          onUpdate={handleUpdate}
          onUnload={handleUnload}
          isFocused={currentChatId === id}
        />
      ))}
      {children}
    </MultiChatContext.Provider>
  );
};
