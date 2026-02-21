import type { UIMessage } from "ai";
import { generateId } from "ai";
import { useAtom } from "jotai";
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_MODEL_CONFIG,
  type ModelConfig,
} from "@/hooks/ai/use-model-catalog";
import { asyncLocalStorage } from "@/lib/async-localstorage";
import { chatIdsAtom, chatUpdateTriggerAtom } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";

import { PersistenceContext } from "./persistence-contexts";

const logger = getLogger(import.meta.url);

export interface ChatMetadata {
  title: string;
  titleState?: "generating" | "generated" | "error";
  modelId?: string;
  modelConfig?: ModelConfig;
  branchOf?: string;
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
    messages: UIMessage[];
  }) => string;
  chatUpdateTrigger: number;
}

const NEW_CHAT_MODEL_ID_KEY = "new-chat-model-id";
const NEW_CHAT_MODEL_CONFIG_KEY = "new-chat-model-config";

function getChatKey(id: string): string {
  return `chat-${id}`;
}

const DEFAULT_METADATA: ChatMetadata = {
  title: "New chat",
  titleState: undefined,
  modelId: undefined,
  modelConfig: undefined,
  branchOf: undefined,
};

export const PersistenceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [_chatIds, setChatIds] = useAtom(chatIdsAtom);
  const [chatUpdateTrigger, setChatUpdateTrigger] = useAtom(
    chatUpdateTriggerAtom,
  );

  const metadataCacheRef = useRef<Map<string, ChatMetadata>>(new Map());
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAllMetadata = async () => {
      const ids = _chatIds;
      const cache = new Map<string, ChatMetadata>();

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const raw = await asyncLocalStorage.getItem(getChatKey(id));
            if (raw) {
              const parsed = JSON.parse(raw) as ChatData;
              const metadata: ChatMetadata = {
                title: parsed.title,
                titleState: parsed.titleState,
                modelId: parsed.modelId,
                modelConfig: parsed.modelConfig,
                branchOf: parsed.branchOf,
              };
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
      setIsMetadataLoaded(true);
    };

    void loadAllMetadata();

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

  const persistChatData = useCallback(
    (id: string, metadata: ChatMetadata, messages: UIMessage[]) => {
      const chatData: ChatData = { ...metadata, messages };
      asyncLocalStorage.setItem(getChatKey(id), JSON.stringify(chatData));
    },
    [],
  );

  const createChat = useCallback(
    (modelId: string, modelConfig: ModelConfig = DEFAULT_MODEL_CONFIG) => {
      const id = generateId();
      const metadata: ChatMetadata = {
        title: "New chat",
        titleState: undefined,
        modelId,
        modelConfig,
        branchOf: undefined,
      };
      setMetadata(id, metadata);
      persistChatData(id, metadata, []);
      setChatIds((currentChatIds) => [id, ...currentChatIds]);
      setChatUpdateTrigger((prev) => prev + 1);
      return id;
    },
    [setChatIds, setChatUpdateTrigger, setMetadata, persistChatData],
  );

  const loadChatMetadata = useCallback(
    (id: string): ChatMetadata => {
      return getMetadata(id);
    },
    [getMetadata],
  );

  const loadChatMessages = useCallback(async (id: string) => {
    try {
      const raw = await asyncLocalStorage.getItem(getChatKey(id));
      if (raw) {
        const parsed = JSON.parse(raw) as ChatData;
        return parsed.messages;
      }
      logger.warn(`No chat found for id: ${id}`);
      return [];
    } catch (error) {
      logger.error(`Failed to load chat messages ${id}`, error);
      return [];
    }
  }, []);

  const loadFullChatData = useCallback(
    async (id: string): Promise<ChatData> => {
      try {
        const raw = await asyncLocalStorage.getItem(getChatKey(id));
        if (raw) {
          return JSON.parse(raw) as ChatData;
        }
        logger.warn(`No chat found for id: ${id}`);
        return { messages: [], ...DEFAULT_METADATA };
      } catch (error) {
        logger.error(`Failed to load full chat data ${id}`, error);
        return { messages: [], ...DEFAULT_METADATA };
      }
    },
    [],
  );

  const saveChat = useCallback(
    ({ chatId, messages }: { chatId: string; messages: UIMessage[] }) => {
      try {
        const metadata = getMetadata(chatId);
        persistChatData(chatId, metadata, messages);
      } catch (error) {
        logger.error(`Failed to save chat ${chatId}`, error);
      }
    },
    [getMetadata, persistChatData],
  );

  const saveChatModel = useCallback(
    ({ chatId, modelId }: { chatId: string; modelId: string }) => {
      try {
        const metadata = getMetadata(chatId);
        const updated = { ...metadata, modelId };
        setMetadata(chatId, updated);
        loadChatMessages(chatId)
          .then((messages) => {
            persistChatData(chatId, updated, messages);
          })
          .catch((error) => {
            logger.error(`Failed to persist chat model for ${chatId}`, error);
          });
      } catch (error) {
        logger.error(`Failed to save chat model ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, loadChatMessages, persistChatData],
  );

  const saveChatModelConfig = useCallback(
    ({ chatId, modelConfig }: { chatId: string; modelConfig: ModelConfig }) => {
      try {
        const metadata = getMetadata(chatId);
        const updated = { ...metadata, modelConfig };
        setMetadata(chatId, updated);
        loadChatMessages(chatId)
          .then((messages) => {
            persistChatData(chatId, updated, messages);
          })
          .catch((error) => {
            logger.error(
              `Failed to persist chat model config for ${chatId}`,
              error,
            );
          });
      } catch (error) {
        logger.error(`Failed to save chat model config ${chatId}`, error);
      }
    },
    [getMetadata, setMetadata, loadChatMessages, persistChatData],
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
        const metadata = getMetadata(chatId);
        const updated = { ...metadata, titleState };
        setMetadata(chatId, updated);
        loadChatMessages(chatId)
          .then((messages) => {
            persistChatData(chatId, updated, messages);
          })
          .catch((error) => {
            logger.error(
              `Failed to persist chat title state for ${chatId}`,
              error,
            );
          });
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(`Failed to save chat title state ${chatId}`, error);
      }
    },
    [
      getMetadata,
      setMetadata,
      loadChatMessages,
      persistChatData,
      setChatUpdateTrigger,
    ],
  );

  const saveChatTitle = useCallback(
    ({ chatId, title }: { chatId: string; title: string }) => {
      try {
        const metadata = getMetadata(chatId);
        const updated: ChatMetadata = {
          ...metadata,
          title,
          titleState: "generated",
        };
        setMetadata(chatId, updated);
        loadChatMessages(chatId)
          .then((messages) => {
            persistChatData(chatId, updated, messages);
          })
          .catch((error) => {
            logger.error(`Failed to persist chat title for ${chatId}`, error);
          });
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(`Failed to save chat title ${chatId}`, error);
      }
    },
    [
      getMetadata,
      setMetadata,
      loadChatMessages,
      persistChatData,
      setChatUpdateTrigger,
    ],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      try {
        asyncLocalStorage.removeItem(getChatKey(chatId));
        removeMetadata(chatId);
        setChatIds((currentChatIds) =>
          currentChatIds.filter((id: string) => id !== chatId),
        );
        setChatUpdateTrigger((prev) => prev + 1);
      } catch (error) {
        logger.error(`Failed to delete chat ${chatId}`, error);
      }
    },
    [setChatIds, setChatUpdateTrigger, removeMetadata],
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

        const branchIndex = messages.findIndex(
          (m: UIMessage) => m.id === branchFromMessageId,
        );

        if (branchIndex === -1) {
          throw new Error(
            `Message with ID ${branchFromMessageId} not found in chat ${originalChatId}.`,
          );
        }

        const branchedMessages = messages.slice(0, branchIndex + 1);

        const newId = generateId();
        const newMetadata: ChatMetadata = {
          title: originalMetadata.title,
          titleState: "generated",
          modelId: originalMetadata.modelId,
          modelConfig: originalMetadata.modelConfig || DEFAULT_MODEL_CONFIG,
          branchOf: originalChatId,
        };

        setMetadata(newId, newMetadata);
        persistChatData(newId, newMetadata, branchedMessages);

        setChatIds((currentChatIds) => [newId, ...currentChatIds]);
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
      persistChatData,
      setChatIds,
      setChatUpdateTrigger,
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

  return (
    <PersistenceContext.Provider value={contextValue}>
      {children}
    </PersistenceContext.Provider>
  );
};
