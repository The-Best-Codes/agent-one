import type { UIMessage } from "ai";
import { generateId } from "ai";
import { useAtom } from "jotai";
import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_MODEL_CONFIG, type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { chatIdsAtom, chatUpdateTriggerAtom, lastVacuumTimestampAtom } from "@/lib/jotai/atoms";
import { chatSortAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { type ChatSearchResult, chatStorage } from "@/lib/storage/chat-storage";
import { emitWindowSyncEvent, onWindowSyncEvent } from "@/lib/sync/window-sync";

import { PersistenceContext } from "./persistence-contexts";

const logger = getLogger(import.meta.url);

export interface ChatMetadata {
  title: string;
  titleState?: "generating" | "generated" | "error";
  modelId?: string;
  modelConfig?: ModelConfig;
  branchOf?: string;
  createdAt?: number;
  updatedAt?: number;
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
  bulkDeleteChats: (chatIds: string[]) => void;
  bulkExportChats: (chatIds: string[]) => Promise<ChatData[]>;
  searchChats: (query: string, rawOperators?: boolean) => Promise<ChatSearchResult[]>;
  branchChat: (params: {
    originalChatId: string;
    branchFromMessageId: string;
    messages: UIMessage[];
  }) => string;
  chatUpdateTrigger: number;
}

const NEW_CHAT_MODEL_ID_KEY = "new-chat-model-id";
const NEW_CHAT_MODEL_CONFIG_KEY = "new-chat-model-config";

const DEFAULT_METADATA: ChatMetadata = {
  title: "New chat",
  titleState: undefined,
  modelId: undefined,
  modelConfig: undefined,
  branchOf: undefined,
  createdAt: undefined,
  updatedAt: undefined,
};

function createTimestampedMetadata(metadata: ChatMetadata): ChatMetadata {
  const now = Date.now();
  return {
    ...metadata,
    createdAt: metadata.createdAt ?? now,
    updatedAt: metadata.updatedAt ?? now,
  };
}

function touchMetadata(metadata: ChatMetadata): ChatMetadata {
  const now = Date.now();
  return {
    ...metadata,
    createdAt: metadata.createdAt ?? now,
    updatedAt: now,
  };
}

export const PersistenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [, setChatIds] = useAtom(chatIdsAtom);
  const [chatUpdateTrigger, setChatUpdateTrigger] = useAtom(chatUpdateTriggerAtom);
  const [lastVacuumTimestamp, setLastVacuumTimestamp] = useAtom(lastVacuumTimestampAtom);
  const [chatSort] = useAtom(chatSortAtom);

  const metadataCacheRef = useRef<Map<string, ChatMetadata>>(new Map());
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      const storedChats = await chatStorage.listChats(chatSort);

      if (cancelled) return;

      const cache = new Map<string, ChatMetadata>();
      for (const { id, metadata } of storedChats) {
        cache.set(id, metadata);
      }

      metadataCacheRef.current = cache;
      setChatIds(storedChats.map(({ id }) => id));
      setIsMetadataLoaded(true);
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [chatSort, setChatIds]);

  useEffect(() => {
    void chatStorage.removeItem("chat-ids").catch((error) => {
      logger.error("Failed to remove legacy chat ID list", error);
    });
  }, []);

  useEffect(() => {
    void chatStorage
      .performStartupMaintenance()
      .then(() => chatStorage.ensureSearchIndexConsistency())
      .then(() => {
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (Date.now() - lastVacuumTimestamp > oneDayMs) {
          return chatStorage.vacuum().then(() => {
            setLastVacuumTimestamp(Date.now());
          });
        }
      })
      .catch((error) => {
        logger.error("Failed to run chat storage startup maintenance", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;

    void onWindowSyncEvent((event) => {
      switch (event.type) {
        case "chat-created":
        case "chat-branched": {
          metadataCacheRef.current.set(event.chatId, event.metadata);
          setChatIds((curr) => (curr.includes(event.chatId) ? curr : [event.chatId, ...curr]));
          setChatUpdateTrigger((p) => p + 1);
          break;
        }
        case "chat-deleted": {
          metadataCacheRef.current.delete(event.chatId);
          setChatIds((curr) => curr.filter((id) => id !== event.chatId));
          setChatUpdateTrigger((p) => p + 1);
          break;
        }
        case "chats-bulk-deleted": {
          const deleted = new Set(event.chatIds);
          for (const id of event.chatIds) metadataCacheRef.current.delete(id);
          setChatIds((curr) => curr.filter((id) => !deleted.has(id)));
          setChatUpdateTrigger((p) => p + 1);
          break;
        }
        case "chat-metadata-updated": {
          metadataCacheRef.current.set(event.chatId, event.metadata);
          setChatUpdateTrigger((p) => p + 1);
          break;
        }
      }
    }).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [setChatIds, setChatUpdateTrigger]);

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
    void chatStorage.setChatMetadata(id, metadata).catch((error) => {
      logger.error(`Failed to persist chat metadata ${id}`, error);
    });
  }, []);

  const persistMessages = useCallback((id: string, messages: UIMessage[]) => {
    void chatStorage.setChatMessages(id, messages).catch((error) => {
      logger.error(`Failed to persist chat messages ${id}`, error);
    });
  }, []);

  const createChat = useCallback(
    (modelId: string, modelConfig: ModelConfig = DEFAULT_MODEL_CONFIG) => {
      const id = generateId();
      const metadata = createTimestampedMetadata({
        title: "New chat",
        titleState: undefined,
        modelId,
        modelConfig,
        branchOf: undefined,
      });
      setMetadata(id, metadata);
      persistMetadata(id, metadata);
      persistMessages(id, []);
      void chatStorage.updateFtsIndex(id, metadata.title, []).catch((error) => {
        logger.error(`Failed to update FTS index ${id}`, error);
      });
      setChatIds((currentChatIds) => {
        return currentChatIds.includes(id) ? currentChatIds : [id, ...currentChatIds];
      });
      setChatUpdateTrigger((prev) => prev + 1);
      emitWindowSyncEvent({ type: "chat-created", chatId: id, metadata });
      return id;
    },
    [setChatIds, setChatUpdateTrigger, setMetadata, persistMetadata, persistMessages],
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
        const updatedMetadata = touchMetadata({
          ...getMetadata(chatId),
        });

        setMetadata(chatId, updatedMetadata);
        persistMetadata(chatId, updatedMetadata);
        persistMessages(chatId, messages);
        void chatStorage.updateFtsIndex(chatId, updatedMetadata.title, messages).catch((error) => {
          logger.error(`Failed to update FTS index ${chatId}`, error);
        });
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({
          type: "chat-metadata-updated",
          chatId,
          metadata: updatedMetadata,
        });
      } catch (error) {
        logger.error(`Failed to save chat ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, persistMessages, setChatUpdateTrigger],
  );

  const saveChatModel = useCallback(
    ({ chatId, modelId }: { chatId: string; modelId: string }) => {
      try {
        const updated = touchMetadata({ ...getMetadata(chatId), modelId });
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({
          type: "chat-metadata-updated",
          chatId,
          metadata: updated,
        });
      } catch (error) {
        logger.error(`Failed to save chat model ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, setChatUpdateTrigger],
  );

  const saveChatModelConfig = useCallback(
    ({ chatId, modelConfig }: { chatId: string; modelConfig: ModelConfig }) => {
      try {
        const updated = touchMetadata({ ...getMetadata(chatId), modelConfig });
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({
          type: "chat-metadata-updated",
          chatId,
          metadata: updated,
        });
      } catch (error) {
        logger.error(`Failed to save chat model config ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, setChatUpdateTrigger],
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
        const updated = touchMetadata({ ...getMetadata(chatId), titleState });
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({
          type: "chat-metadata-updated",
          chatId,
          metadata: updated,
        });
      } catch (error) {
        logger.error(`Failed to save chat title state ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, setChatUpdateTrigger],
  );

  const saveChatTitle = useCallback(
    ({ chatId, title }: { chatId: string; title: string }) => {
      try {
        const updated = touchMetadata({
          ...getMetadata(chatId),
          title,
          titleState: "generated",
        });
        setMetadata(chatId, updated);
        persistMetadata(chatId, updated);
        void chatStorage.updateFtsTitle(chatId, title).catch((error) => {
          logger.error(`Failed to update FTS title ${chatId}`, error);
        });
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({
          type: "chat-metadata-updated",
          chatId,
          metadata: updated,
        });
      } catch (error) {
        logger.error(`Failed to save chat title ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, persistMetadata, setChatUpdateTrigger],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      try {
        void chatStorage.deleteChat(chatId).catch((error) => {
          logger.error(`Failed to delete chat ${chatId}`, error);
        });
        removeMetadata(chatId);
        setChatIds((currentChatIds) => {
          return currentChatIds.filter((id: string) => id !== chatId);
        });
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({ type: "chat-deleted", chatId });
      } catch (error) {
        logger.error(`Failed to delete chat ${chatId}`, error);
      }
    },
    [setChatIds, setChatUpdateTrigger, removeMetadata],
  );

  const bulkDeleteChats = useCallback(
    (chatIds: string[]) => {
      try {
        void chatStorage.bulkDeleteChats(chatIds).catch((error) => {
          logger.error("Failed to bulk delete chats from storage", error);
        });
        for (const id of chatIds) {
          removeMetadata(id);
        }
        setChatIds((currentChatIds) => {
          return currentChatIds.filter((id: string) => !chatIds.includes(id));
        });
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({ type: "chats-bulk-deleted", chatIds });
      } catch (error) {
        logger.error("Failed to bulk delete chats", error);
      }
    },
    [setChatIds, setChatUpdateTrigger, removeMetadata],
  );

  const bulkExportChats = useCallback(
    async (chatIds: string[]): Promise<ChatData[]> => {
      return Promise.all(chatIds.map((id) => loadFullChatData(id)));
    },
    [loadFullChatData],
  );

  const searchChats = useCallback(
    async (query: string, rawOperators?: boolean): Promise<ChatSearchResult[]> => {
      return chatStorage.searchChats(query, rawOperators);
    },
    [],
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

        const newId = generateId();
        const newMetadata = createTimestampedMetadata({
          title: originalMetadata.title,
          titleState: "generated",
          modelId: originalMetadata.modelId,
          modelConfig: originalMetadata.modelConfig || DEFAULT_MODEL_CONFIG,
          branchOf: originalChatId,
        });

        setMetadata(newId, newMetadata);
        persistMetadata(newId, newMetadata);
        persistMessages(newId, branchedMessages);
        void chatStorage
          .updateFtsIndex(newId, newMetadata.title, branchedMessages)
          .catch((error) => {
            logger.error(`Failed to update FTS index ${newId}`, error);
          });

        setChatIds((currentChatIds) => {
          return currentChatIds.includes(newId) ? currentChatIds : [newId, ...currentChatIds];
        });
        setChatUpdateTrigger((prev) => prev + 1);
        emitWindowSyncEvent({
          type: "chat-branched",
          chatId: newId,
          metadata: newMetadata,
        });

        logger.verbose(`Chat ${originalChatId} branched to new chat ${newId}`);
        return newId;
      } catch (error) {
        logger.error("Failed to branch chat", error);
        throw new Error("Failed to branch chat.", { cause: error });
      }
    },
    [getMetadata, setMetadata, persistMetadata, persistMessages, setChatIds, setChatUpdateTrigger],
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
    bulkDeleteChats,
    bulkExportChats,
    searchChats,
    branchChat,
    chatUpdateTrigger,
  };

  return <PersistenceContext.Provider value={contextValue}>{children}</PersistenceContext.Provider>;
};
