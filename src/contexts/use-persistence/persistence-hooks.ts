import type { UIMessage } from "ai";
import { useContext } from "react";

import { PersistenceContext } from "./persistence-contexts";

export interface ChatMetadata {
  id: string;
  title: string;
  createdAt: number;
  modelId?: string;
}

export interface ChatData extends ChatMetadata {
  messages: UIMessage[];
  titleState?: "generating" | "generated" | "error";
}

export interface PersistenceContextType {
  chats: ChatMetadata[];
  createChat: (modelId: string) => Promise<string>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  loadChat: (chatId: string) => Promise<ChatData | null>;
  saveChat: (
    chatData: Pick<ChatData, "id" | "messages"> & Partial<ChatData>,
  ) => Promise<void>;
  forkChat: (
    originalChatId: string,
    forkFromMessageId: string,
  ) => Promise<string | null>;
  getNewChatModelId: () => Promise<string | null>;
  saveNewChatModelId: (modelId: string) => void;
  saveChatModel: (chatId: string, modelId: string) => void;
  saveChatTitleState: (
    chatId: string,
    titleState: ChatData["titleState"],
  ) => Promise<void>;
  isLoading: boolean;
}

export const usePersistence = (): PersistenceContextType => {
  const context = useContext(PersistenceContext);
  if (context === undefined) {
    throw new Error("usePersistence must be used within a PersistenceProvider");
  }
  return context;
};
