import type { UIMessage } from "ai";
import { generateId } from "ai";
import { useAtom } from "jotai";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_MODEL_CONFIG, type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { calculateChatUsageFromMessages } from "@/lib/ai/chat-usage";
import { chatIdsAtom, chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";
import { chatStorage } from "@/lib/storage/chat-storage";

import { PersistenceContext } from "./persistence-contexts";

const logger = getLogger(import.meta.url);

export interface ChatMetadata {
  title: string;
  titleState?: "generating" | "generated" | "error";
  modelId?: string;
  modelConfig?: ModelConfig;
  branchOf?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalCostUsd?: number;
}

export interface ChatData extends ChatMetadata {
  messages: UIMessage[];
}

export interface PersistenceContextType {
  isMetadataLoaded: boolean;
  getNewChatModelId: () => string | null;
  saveNewChatModelId: (modelId: string) => void;
  getNewChatModelConfig: () => ModelConfig;
  saveNewChatModelConfig: (config: ModelConfig) => void;
  createChat: (modelId: string, modelConfig?: ModelConfig) => string;
  loadChatMessages: (id: string) => Promise<UIMessage[]>;
  loadChatMetadata: (id: string) => ChatMetadata;
  loadFullChatData: (id: string) => Promise<ChatData>;
  saveChat: (params: { chatId: string; messages: UIMessage[] }) => void;
  saveChatModel: (params: { chatId: string; modelId: string }) => void;
  saveChatModelConfig: (params: { chatId: string; modelConfig: ModelConfig }) => void;
  saveChatTitleState: (params: {
    chatId: string;
    titleState: "generating" | "generated" | "error";
  }) => void;
  saveChatTitle: (params: { chatId: string; title: string }) => void;
  deleteChat: (chatId: string) => void;
  branchChat: (params: {
    originalChatId: string;
    branchFromMessageId: string;
    messages: UIMessage[];
  }) => string;
  chatUpdateTrigger: number;
}

const CHAT_IDS_KEY = "chat-ids";
const NEW_CHAT_MODEL_ID_KEY = "new-chat-model-id";
const NEW_CHAT_MODEL_CONFIG_KEY = "new-chat-model-config";

const DEFAULT_METADATA: ChatMetadata = {
  title: "New chat",
  titleState: undefined,
  modelId: undefined,
  modelConfig: undefined,
  branchOf: undefined,
  inputTokens: 0,
  outputTokens: 0,
  totalCostUsd: 0,
};

export const PersistenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [, setChatIds] = useAtom(chatIdsAtom);
  const [chatUpdateTrigger, setChatUpdateTrigger] = useAtom(chatUpdateTriggerAtom);

  const metadataCacheRef = useRef<Map<string, ChatMetadata>>(new Map());
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  const persistChatIds = useCallback((ids: string[]) => {
    void chatStorage.setItem(CHAT_IDS_KEY, JSON.stringify(ids));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      const rawIds = await chatStorage.getItem(CHAT_IDS_KEY);
      if (cancelled) return;

      let ids: string[] = [];
      if (rawIds) {
        try {
          ids = JSON.parse(rawIds);
        } catch (error) {
          logger.error("Failed to parse chat IDs from storage", error);
        }
      }

      const cache = new Map<string, ChatMetadata>();

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const metadata = await chatStorage.getChatMetadata(id);
            if (metadata) {
              return [id, metadata] as const;
            }
            return [id, { ...DEFAULT_METADATA }] as const;
          } catch (error) {
            logger.error(`Failed to load metadata for chat ${id}`, error);
            return [id, { ...DEFAULT_METADATA }] as const;
          }
        }),
      );

      if (cancelled) return;

      for (const [id, metadata] of results) {
        cache.set(id, metadata);
      }

      metadataCacheRef.current = cache;
      setChatIds(ids);
      setIsMetadataLoaded(true);
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMetadata = useCallback((id: string): ChatMetadata => {
    return metadataCacheRef.current.get(id) ?? { ...DEFAULT_METADATA };
  }, []);

  const setMetadata = useCallback((id: string, metadata: ChatMetadata) => {
    metadataCacheRef.current.set(id, metadata);
  }, []);

  const removeMetadata = useCallback((id: string) => {
    metadataCacheRef.current.delete(id);
  }, []);

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
      logger.error("Failed to get new chat model config from localStorage", error);
      return DEFAULT_MODEL_CONFIG;
    }
  }, []);

  const saveNewChatModelConfig = useCallback((config: ModelConfig) => {
    try {
      localStorage.setItem(NEW_CHAT_MODEL_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      logger.error("Failed to save new chat model config to localStorage", error);
    }
  }, []);

  const persistMetadata = useCallback((id: string, metadata: ChatMetadata) => {
    void chatStorage.setChatMetadata(id, metadata);
  }, []);

  const persistMessages = useCallback((id: string, messages: UIMessage[]) => {
    void chatStorage.setChatMessages(id, messages);
  }, []);

  const createChat = useCallback(
    (modelId: string, modelConfig: ModelConfig = DEFAULT_MODEL_CONFIG) => {
      const id = generateId();
      const metadata: ChatMetadata = {
        title: "New chat",
        titleState: undefined,
        modelId,
        modelConfig,
        branchOf: undefined,
        inputTokens: 0,
        outputTokens: 0,
        totalCostUsd: 0,
      };
      setMetadata(id, metadata);
      persistMetadata(id, metadata);
      persistMessages(id, []);
      setChatIds((currentChatIds) => {
        const next = [id, ...currentChatIds];
        persistChatIds(next);
        return next;
      });
      setChatUpdateTrigger((prev) => prev + 1);
      return id;
    },
    [
      setChatIds,
      setChatUpdateTrigger,
      setMetadata,
      persistMetadata,
      persistMessages,
      persistChatIds,
    ],
  );

  const loadChatMetadata = useCallback(
    (id: string): ChatMetadata => {
      return getMetadata(id);
    },
    [getMetadata],
  );

  const loadChatMessages = useCallback(async (id: string) => {
    try {
      const messages = await chatStorage.getChatMessages(id);
      if (messages) return messages;
      logger.warn(`No chat found for id: ${id}`);
      return [];
    } catch (error) {
      logger.error(`Failed to load chat messages ${id}`, error);
      return [];
    }
  }, []);

  const loadFullChatData = useCallback(async (id: string): Promise<ChatData> => {
    try {
      const [metadata, messages] = await Promise.all([
        chatStorage.getChatMetadata(id),
        chatStorage.getChatMessages(id),
      ]);
      if (metadata) {
        return { ...metadata, messages: messages ?? [] };
      }
      logger.warn(`No chat found for id: ${id}`);
      return { messages: [], ...DEFAULT_METADATA };
    } catch (error) {
      logger.error(`Failed to load full chat data ${id}`, error);
      return { messages: [], ...DEFAULT_METADATA };
    }
  }, []);

  const saveChat = useCallback(
    ({ chatId, messages }: { chatId: string; messages: UIMessage[] }) => {
      try {
        const usage = calculateChatUsageFromMessages(messages);
        const updatedMetadata: ChatMetadata = {
          ...getMetadata(chatId),
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalCostUsd: usage.totalCostUsd,
        };

        setMetadata(chatId, updatedMetadata);
        persistMetadata(chatId, updatedMetadata);
        persistMessages(chatId, messages);
      } catch (error) {
        logger.error(`Failed to save chat ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, persistMessages],
  );

  const saveChatModel = useCallback(
    ({ chatId, modelId }: { chatId: string; modelId: string }) => {
      try {
        const updated = { ...getMetadata(chatId), modelId };
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
      } catch (error) {
        logger.error(`Failed to save chat model ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata],
  );

  const saveChatModelConfig = useCallback(
    ({ chatId, modelConfig }: { chatId: string; modelConfig: ModelConfig }) => {
      try {
        const updated = { ...getMetadata(chatId), modelConfig };
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
      } catch (error) {
        logger.error(`Failed to save chat model config ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata],
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
        const updated = { ...getMetadata(chatId), titleState };
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(`Failed to save chat title state ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, setChatUpdateTrigger],
  );

  const saveChatTitle = useCallback(
    ({ chatId, title }: { chatId: string; title: string }) => {
      try {
        const updated: ChatMetadata = {
          ...getMetadata(chatId),
          title,
          titleState: "generated",
        };
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(`Failed to save chat title ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, setChatUpdateTrigger],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      try {
        void chatStorage.deleteChat(chatId);
        removeMetadata(chatId);
        setChatIds((currentChatIds) => {
          const next = currentChatIds.filter((id: string) => id !== chatId);
          persistChatIds(next);
          return next;
        });
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(`Failed to delete chat ${chatId}`, error);
      }
    },
    [setChatIds, setChatUpdateTrigger, removeMetadata, persistChatIds],
  );

  const branchChat = useCallback(
    ({
      originalChatId,
      branchFromMessageId,
      messages,
    }: {
      originalChatId: string;
      branchFromMessageId: string;
      messages: UIMessage[];
    }) => {
      try {
        const originalMetadata = getMetadata(originalChatId);

        const branchIndex = messages.findIndex((m: UIMessage) => m.id === branchFromMessageId);

        if (branchIndex === -1) {
          throw new Error(
            `Message with ID ${branchFromMessageId} not found in chat ${originalChatId}.`,
          );
        }

        const branchedMessages = messages.slice(0, branchIndex + 1);
        const branchUsage = calculateChatUsageFromMessages(branchedMessages);

        const newId = generateId();
        const newMetadata: ChatMetadata = {
          title: originalMetadata.title,
          titleState: "generated",
          modelId: originalMetadata.modelId,
          modelConfig: originalMetadata.modelConfig || DEFAULT_MODEL_CONFIG,
          branchOf: originalChatId,
          inputTokens: branchUsage.inputTokens,
          outputTokens: branchUsage.outputTokens,
          totalCostUsd: branchUsage.totalCostUsd,
        };

        setMetadata(newId, newMetadata);
        persistMetadata(newId, newMetadata);
        persistMessages(newId, branchedMessages);

        setChatIds((currentChatIds) => {
          const next = [newId, ...currentChatIds];
          persistChatIds(next);
          return next;
        });
        setChatUpdateTrigger((prev) => prev + 1);

        logger.verbose(`Chat ${originalChatId} branched to new chat ${newId}`);
        return newId;
      } catch (error) {
        logger.error("Failed to branch chat", error);
        throw new Error("Failed to branch chat.", { cause: error });
      }
    },
    [
      getMetadata,
      setMetadata,
      persistMetadata,
      persistMessages,
      setChatIds,
      setChatUpdateTrigger,
      persistChatIds,
    ],
  );

  const contextValue: PersistenceContextType = {
    isMetadataLoaded,
    getNewChatModelId,
    saveNewChatModelId,
    getNewChatModelConfig,
    saveNewChatModelConfig,
    createChat,
    loadChatMessages,
    loadChatMetadata,
    loadFullChatData,
    saveChat,
    saveChatModel,
    saveChatModelConfig,
    saveChatTitleState,
    saveChatTitle,
    deleteChat,
    branchChat,
    chatUpdateTrigger,
  };

  return <PersistenceContext.Provider value={contextValue}>{children}</PersistenceContext.Provider>;
};
