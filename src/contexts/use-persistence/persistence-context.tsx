import type { UIMessage } from "ai";
import { generateId } from "ai";
import { useAtom } from "jotai";
import React, { type ReactNode, useCallback } from "react";

import {
  DEFAULT_MODEL_CONFIG,
  type ModelConfig,
} from "@/hooks/ai/use-model-catalog";
import { chatIdsAtom, chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
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
  createChat: (modelId: string, modelConfig?: ModelConfig) => string;
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
  deleteChat: (chatId: string) => void;
  branchChat: (params: {
    originalChatId: string;
    branchFromMessageId: string;
  }) => string;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_chatIds, setChatIds] = useAtom(chatIdsAtom);
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
    (modelId: string, modelConfig: ModelConfig = DEFAULT_MODEL_CONFIG) => {
      const id = generateId();
      try {
        const chatKey = getChatKey(id);
        const chatData: ChatData = {
          messages: [],
          title: "New chat",
          titleState: undefined,
          modelId,
          modelConfig,
        };
        localStorage.setItem(chatKey, JSON.stringify(chatData));
        setChatIds((currentChatIds) => [id, ...currentChatIds]);
        setChatUpdateTrigger((prev) => prev + 1);
        return id;
      } catch (error) {
        logger.error("Failed to create chat in localStorage", error);
        throw new Error("Failed to create new chat in localStorage.");
      }
    },
    [setChatIds, setChatUpdateTrigger],
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

  const loadChat = useCallback(
    (id: string) => {
      const chatData = loadChatData(id);
      return chatData.messages;
    },
    [loadChatData],
  );

  const saveChat = useCallback(
    ({ chatId, messages }: { chatId: string; messages: UIMessage[] }) => {
      try {
        const chatKey = getChatKey(chatId);
        const existingData = loadChatData(chatId);
        const chatData: ChatData = {
          ...existingData,
          messages,
        };
        const content = JSON.stringify(chatData);
        localStorage.setItem(chatKey, content);
      } catch (error) {
        logger.error(`Failed to save chat ${chatId} to localStorage`, error);
      }
    },
    [loadChatData],
  );

  const saveChatModel = useCallback(
    ({ chatId, modelId }: { chatId: string; modelId: string }) => {
      try {
        const chatKey = getChatKey(chatId);
        const existingData = loadChatData(chatId);
        const chatData: ChatData = {
          ...existingData,
          modelId,
        };
        const content = JSON.stringify(chatData);
        localStorage.setItem(chatKey, content);
      } catch (error) {
        logger.error(
          `Failed to save chat model ${chatId} to localStorage`,
          error,
        );
      }
    },
    [loadChatData],
  );

  const saveChatModelConfig = useCallback(
    ({ chatId, modelConfig }: { chatId: string; modelConfig: ModelConfig }) => {
      try {
        const chatKey = getChatKey(chatId);
        const existingData = loadChatData(chatId);
        const chatData: ChatData = {
          ...existingData,
          modelConfig,
        };
        const content = JSON.stringify(chatData);
        localStorage.setItem(chatKey, content);
      } catch (error) {
        logger.error(
          `Failed to save chat model config ${chatId} to localStorage`,
          error,
        );
      }
    },
    [loadChatData],
  );

  const saveChatTitleState = useCallback(
    ({
      chatId,
      titleState,
    }: {
      chatId: string;
      titleState: "generating" | "generated" | "error";
    }) => {
      try {
        const chatKey = getChatKey(chatId);
        const existingData = loadChatData(chatId);
        const chatData: ChatData = {
          ...existingData,
          titleState,
        };
        const content = JSON.stringify(chatData);
        localStorage.setItem(chatKey, content);
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(
          `Failed to save chat title state ${chatId} to localStorage`,
          error,
        );
      }
    },
    [loadChatData, setChatUpdateTrigger],
  );

  const saveChatTitle = useCallback(
    ({ chatId, title }: { chatId: string; title: string }) => {
      try {
        const chatKey = getChatKey(chatId);
        const existingData = loadChatData(chatId);
        const chatData: ChatData = {
          ...existingData,
          title,
          titleState: "generated",
        };
        const content = JSON.stringify(chatData);
        localStorage.setItem(chatKey, content);
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(
          `Failed to save chat title ${chatId} to localStorage`,
          error,
        );
      }
    },
    [loadChatData, setChatUpdateTrigger],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      try {
        const chatKey = getChatKey(chatId);
        localStorage.removeItem(chatKey);
        setChatIds((currentChatIds) =>
          currentChatIds.filter((id: string) => id !== chatId),
        );
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(
          `Failed to delete chat ${chatId} from localStorage`,
          error,
        );
      }
    },
    [setChatIds, setChatUpdateTrigger],
  );

  const branchChat = useCallback(
    ({
      originalChatId,
      branchFromMessageId,
    }: {
      originalChatId: string;
      branchFromMessageId: string;
    }) => {
      try {
        const originalChatData = loadChatData(originalChatId);
        if (!originalChatData) {
          throw new Error(`Original chat with ID ${originalChatId} not found.`);
        }

        const branchIndex = originalChatData.messages.findIndex(
          (m: UIMessage) => m.id === branchFromMessageId,
        );

        if (branchIndex === -1) {
          throw new Error(
            `Message with ID ${branchFromMessageId} not found in chat ${originalChatId}.`,
          );
        }

        const branchedMessages = originalChatData.messages.slice(
          0,
          branchIndex + 1,
        );

        const newId = generateId();

        const newChatData: ChatData = {
          messages: branchedMessages,
          title: originalChatData.title,
          titleState: "generated",
          modelId: originalChatData.modelId,
          modelConfig: originalChatData.modelConfig || DEFAULT_MODEL_CONFIG,
          branchOf: originalChatId,
        };

        const chatKey = getChatKey(newId);
        localStorage.setItem(chatKey, JSON.stringify(newChatData));

        setChatIds((currentChatIds) => [newId, ...currentChatIds]);
        setChatUpdateTrigger((prev) => prev + 1);

        logger.verbose(`Chat ${originalChatId} branched to new chat ${newId}`);
        return newId;
      } catch (error) {
        logger.error("Failed to branch chat in localStorage", error);
        throw new Error("Failed to branch chat.");
      }
    },
    [loadChatData, setChatIds, setChatUpdateTrigger],
  );

  const contextValue: PersistenceContextType = {
    getNewChatModelId,
    saveNewChatModelId,
    getNewChatModelConfig,
    saveNewChatModelConfig,
    createChat,
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
