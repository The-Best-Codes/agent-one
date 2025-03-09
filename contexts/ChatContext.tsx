import { Message } from "ai";
import { createChat, getAllChatIds, loadChat } from "@/lib/chat-store";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useChat as useAIChat } from "@ai-sdk/react";
import { useRouter, useSearchParams } from "next/navigation";

interface ChatContextType {
  messages: Message[];
  chatId: string | null;
  chatIds: string[];
  isLoading: boolean;
  isLoadingInitial: boolean;
  isSubmitted: boolean;
  status: string;
  error: Error | undefined;
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent, options?: { experimental_attachments?: any }) => void;
  stop: () => void;
  reload: () => void;
  createNewChat: () => Promise<void>;
  switchChat: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatIds, setChatIds] = useState<string[]>([]);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    stop,
    reload,
  } = useAIChat({
    id: chatId || undefined,
    initialMessages,
    maxSteps: 50,
    sendExtraMessageFields: true,
  });

  const loadChatIds = async () => {
    try {
      const ids = await getAllChatIds();
      setChatIds(ids);
    } catch (error) {
      console.error("Failed to load chat IDs:", error);
    }
  };

  const initializeChat = async (chatIdProp?: string | null) => {
    setIsLoadingInitial(true);
    try {
      let chatIdToUse = chatIdProp || searchParams.get("chatId");

      if (!chatIdToUse) {
        const newChatId = await createChat();
        chatIdToUse = newChatId;
        router.push(`/?chatId=${newChatId}`);
      } else {
        router.push(`/?chatId=${chatIdToUse}`);
      }

      const loadedMessages = await loadChat(chatIdToUse);
      setInitialMessages(loadedMessages);
      setChatId(chatIdToUse);
      await loadChatIds();
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const createNewChat = async () => {
    setIsLoadingInitial(true);
    try {
      const newChatId = await createChat();
      router.push(`/?chatId=${newChatId}`);
      setChatId(newChatId);
      setInitialMessages([]);
      await loadChatIds();
    } catch (error) {
      console.error("Failed to create new chat:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const switchChat = async (id: string) => {
    if (id === chatId) return;
    setIsLoadingInitial(true);
    try {
      const messages = await loadChat(id);
      router.push(`/?chatId=${id}`);
      setChatId(id);
      setInitialMessages(messages);
    } catch (error) {
      console.error("Failed to switch chat:", error);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  useEffect(() => {
    initializeChat();
  }, []);

  const isLoading = status !== "ready";
  const isSubmitted = status === "submitted";

  const value = {
    messages,
    chatId,
    chatIds,
    isLoading,
    isLoadingInitial,
    isSubmitted,
    status,
    error,
    input,
    handleInputChange,
    handleSubmit,
    stop,
    reload,
    createNewChat,
    switchChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
