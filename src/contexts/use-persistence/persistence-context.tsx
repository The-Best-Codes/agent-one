import type { UIMessage } from "ai";
import { generateId } from "ai";
import { useAtom } from "jotai";
import React, { type ReactNode, useCallback } from "react";

import { DEFAULT_MODEL_CONFIG, type ModelConfig } from "@/lib/ai/models";
import { type ChatRecord, db } from "@/lib/db";
import { chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";

import { PersistenceContext } from "./persistence-contexts";

const logger = getLogger(import.meta.url);

export interface ChatData {
  messages: UIMessage[];
  title: string;
  titleState?: "generating" | "generated" | "error";
  modelId?: string;
  modelConfig?: ModelConfig;
  branchOf?: string;
}

export interface PersistenceContextType {
  getNewChatModelId: () => string | null;
  saveNewChatModelId: (modelId: string) => void;
  getNewChatModelConfig: () => ModelConfig;
  saveNewChatModelConfig: (config: ModelConfig) => void;
  createChat: (modelId: string, modelConfig?: ModelConfig) => Promise<string>;
  getChat: (id: string) => Promise<ChatRecord | undefined>;
  loadChat: (id: string) => UIMessage[];
  loadChatData: (id: string) => ChatData;
  saveChat: (params: { chatId: string; messages: UIMessage[] }) => void;
  saveChatModel: (params: { chatId: string; modelId: string }) => void;
  saveChatModelConfig: (params: {
    chatId: string;
    modelConfig: ModelConfig;
  }) => void;
  saveChatTitleState: (params: {
    chatId: string;
    titleState: "generating" | "generated" | "error";
  }) => void;
  saveChatTitle: (params: { chatId: string; title: string }) => void;
  deleteChat: (chatId: string) => Promise<void>;
  branchChat: (params: {
    originalChatId: string;
    branchFromMessageId: string;
  }) => Promise<string>;
  chatUpdateTrigger: number;
}

const NEW_CHAT_MODEL_ID_KEY = "new-chat-model-id";
const NEW_CHAT_MODEL_CONFIG_KEY = "new-chat-model-config";

function getChatKey(id: string): string {
  return `chat-${id}`;
}

export const PersistenceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [chatUpdateTrigger, setChatUpdateTrigger] = useAtom(
    chatUpdateTriggerAtom,
  );

  const getNewChatModelId = useCallback(() => {
    try {
      return localStorage.getItem(NEW_CHAT_MODEL_ID_KEY);
    } catch (error) {
      logger.error("Failed to get new chat model ID from localStorage", error);
      return null;
    }
  }, []);

  const saveNewChatModelId = useCallback((modelId: string) => {
    try {
      localStorage.setItem(NEW_CHAT_MODEL_ID_KEY, modelId);
    } catch (error) {
      logger.error("Failed to save new chat model ID to localStorage", error);
    }
  }, []);

  const getNewChatModelConfig = useCallback((): ModelConfig => {
    try {
      const saved = localStorage.getItem(NEW_CHAT_MODEL_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return DEFAULT_MODEL_CONFIG;
    } catch (error) {
      logger.error(
        "Failed to get new chat model config from localStorage",
        error,
      );
      return DEFAULT_MODEL_CONFIG;
    }
  }, []);

  const saveNewChatModelConfig = useCallback((config: ModelConfig) => {
    try {
      localStorage.setItem(NEW_CHAT_MODEL_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      logger.error(
        "Failed to save new chat model config to localStorage",
        error,
      );
    }
  }, []);

  const createChat = useCallback(
    async (
      modelId: string,
      modelConfig: ModelConfig = DEFAULT_MODEL_CONFIG,
    ) => {
      const id = generateId();
      const now = Date.now();
      try {
        await db.createChat({
          id,
          title: "New Chat",
          messages: [],
          modelId,
          modelConfig,
          createdAt: now,
          updatedAt: now,
        });
        setChatUpdateTrigger((prev) => prev + 1);
        return id;
      } catch (error) {
        logger.error("Failed to create chat in SQLite", error);
        throw new Error("Failed to create new chat.");
      }
    },
    [setChatUpdateTrigger],
  );

  const getChat = useCallback(
    async (id: string): Promise<ChatRecord | undefined> => {
      try {
        return await db.getChat(id);
      } catch (error) {
        logger.error(`Failed to load chat ${id} from SQLite`, error);
        return undefined;
      }
    },
    [],
  );

  const loadChatData = useCallback((id: string) => {
    try {
      const chatKey = getChatKey(id);
      const chatJson = localStorage.getItem(chatKey);
      if (chatJson) {
        const parsed = JSON.parse(chatJson);
        return parsed;
      }
      logger.warn(`No chat found for id: ${id}`);
      return { messages: [], title: "New chat" };
    } catch (error) {
      logger.error(`Failed to load chat ${id} from localStorage`, error);
      return { messages: [], title: "New chat" };
    }
  }, []);

  const loadChat = useCallback((): UIMessage[] => {
    // This is a legacy sync method for backward compatibility
    // It returns empty array and will be populated asynchronously
    return [];
  }, []);

  const saveChat = useCallback(
    ({ chatId, messages }: { chatId: string; messages: UIMessage[] }) => {
      db.updateChat(chatId, {
        messages,
        updatedAt: Date.now(),
      })
        .then(() => {
          // Optional: Trigger update here if you want sidebar to show preview immediately
          // But usually unnecessary for just message content updates unless sidebar shows snippets
          setChatUpdateTrigger((prev) => prev + 1);
        })
        .catch((err) => logger.error("Failed to save chat", err));
    },
    [setChatUpdateTrigger],
  );

  const saveChatModel = useCallback(
    ({ chatId, modelId }: { chatId: string; modelId: string }) => {
      db.updateChat(chatId, {
        modelId,
        updatedAt: Date.now(),
      })
        .then(() => {
          setChatUpdateTrigger((prev) => prev + 1);
        })
        .catch((err) => logger.error("Failed to save chat model", err));
    },
    [setChatUpdateTrigger],
  );

  const saveChatModelConfig = useCallback(
    ({ chatId, modelConfig }: { chatId: string; modelConfig: ModelConfig }) => {
      db.updateChat(chatId, {
        modelConfig,
        updatedAt: Date.now(),
      })
        .then(() => {
          setChatUpdateTrigger((prev) => prev + 1);
        })
        .catch((err) => logger.error("Failed to save chat model config", err));
    },
    [setChatUpdateTrigger],
  );

  const saveChatTitleState = useCallback(
    ({
      chatId,
      titleState,
    }: {
      chatId: string;
      titleState: "generating" | "generated" | "error";
    }) => {
      db.updateChat(chatId, {
        titleState,
      })
        .then(() => {
          setChatUpdateTrigger((prev) => prev + 1);
        })
        .catch((err) => logger.error("Failed to save chat title state", err));
    },
    [setChatUpdateTrigger],
  );

  const saveChatTitle = useCallback(
    ({ chatId, title }: { chatId: string; title: string }) => {
      db.updateChat(chatId, {
        title,
        titleState: "generated" as const,
      })
        .then(() => {
          setChatUpdateTrigger((prev) => prev + 1);
        })
        .catch((err) => logger.error("Failed to save chat title", err));
    },
    [setChatUpdateTrigger],
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        await db.deleteChat(chatId);
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(`Failed to delete chat ${chatId} from SQLite`, error);
      }
    },
    [setChatUpdateTrigger],
  );

  const branchChat = useCallback(
    async ({
      originalChatId,
      branchFromMessageId,
    }: {
      originalChatId: string;
      branchFromMessageId: string;
    }) => {
      try {
        const originalChatRecord = await db.getChat(originalChatId);
        if (!originalChatRecord) {
          throw new Error(`Original chat with ID ${originalChatId} not found.`);
        }

        const branchIndex = originalChatRecord.messages.findIndex(
          (m: UIMessage) => m.id === branchFromMessageId,
        );

        if (branchIndex === -1) {
          throw new Error(
            `Message with ID ${branchFromMessageId} not found in chat ${originalChatId}.`,
          );
        }

        const branchedMessages = originalChatRecord.messages.slice(
          0,
          branchIndex + 1,
        );

        const newId = generateId();
        const now = Date.now();

        const newChatRecord: ChatRecord = {
          id: newId,
          messages: branchedMessages,
          title: originalChatRecord.title,
          titleState: "generated",
          modelId: originalChatRecord.modelId,
          modelConfig: originalChatRecord.modelConfig,
          branchOf: originalChatId,
          createdAt: now,
          updatedAt: now,
        };

        await db.createChat(newChatRecord);
        setChatUpdateTrigger((prev) => prev + 1);

        logger.verbose(`Chat ${originalChatId} branched to new chat ${newId}`);
        return newId;
      } catch (error) {
        logger.error("Failed to branch chat in SQLite", error);
        throw new Error("Failed to branch chat.");
      }
    },
    [setChatUpdateTrigger],
  );

  const contextValue: PersistenceContextType = {
    getNewChatModelId,
    saveNewChatModelId,
    getNewChatModelConfig,
    saveNewChatModelConfig,
    createChat,
    getChat,
    loadChat,
    loadChatData,
    saveChat,
    saveChatModel,
    saveChatModelConfig,
    saveChatTitleState,
    saveChatTitle,
    deleteChat,
    branchChat,
    chatUpdateTrigger,
  };

  return (
    <PersistenceContext.Provider value={contextValue}>
      {children}
    </PersistenceContext.Provider>
  );
};
