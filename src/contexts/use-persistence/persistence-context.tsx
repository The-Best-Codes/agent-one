import { generateId } from "ai";
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getLogger } from "@/lib/logger";

import { PersistenceContext } from "./persistence-contexts";
import type { ChatData, ChatMetadata } from "./persistence-hooks";

const CHAT_IDS_KEY = "chat-ids";
const NEW_CHAT_MODEL_ID_KEY = "new-chat-model-id";
const getChatKey = (id: string): string => `chat-${id}`;

const logger = getLogger(import.meta.url);

// Mock async storage for future compatibility
const ls = {
  getItem: (key: string) =>
    new Promise<string | null>((resolve) => {
      setTimeout(() => resolve(localStorage.getItem(key)), 1000);
    }),
  setItem: (key: string, value: string) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        localStorage.setItem(key, value);
        resolve();
      }, 1000);
    }),
  removeItem: (key: string) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        localStorage.removeItem(key);
        resolve();
      }, 1000);
    }),
};

interface PersistenceProviderProps {
  children: ReactNode;
}

export const PersistenceProvider: React.FC<PersistenceProviderProps> = ({
  children,
}) => {
  const [chats, setChats] = useState<ChatMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChat = useCallback(
    async (chatId: string): Promise<ChatData | null> => {
      try {
        const chatKey = getChatKey(chatId);
        const chatJson = await ls.getItem(chatKey);
        if (chatJson) {
          return JSON.parse(chatJson) as ChatData;
        }
        logger.warn(`No chat found for id: ${chatId}`);
        return null;
      } catch (error) {
        logger.error(`Failed to load chat ${chatId}`, error);
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    const loadInitialChats = async () => {
      try {
        const idsJson = await ls.getItem(CHAT_IDS_KEY);
        const ids: string[] = idsJson ? JSON.parse(idsJson) : [];
        const chatPromises = ids.map(
          async (id): Promise<ChatMetadata | null> => {
            const data = await loadChat(id);
            if (!data) return null;
            return {
              id,
              title: data.title,
              modelId: data.modelId,
              createdAt: data.createdAt,
            };
          },
        );
        const chatMetadataList = (await Promise.all(chatPromises)).filter(
          (c): c is ChatMetadata => c !== null,
        );

        chatMetadataList.sort((a, b) => b.createdAt - a.createdAt);
        setChats(chatMetadataList);
        setIsLoading(false);
      } catch (error) {
        logger.error("Failed to load initial chats", error);
        setIsLoading(false);
      }
    };
    loadInitialChats();
  }, [loadChat]);

  const getChatIds = useCallback(async () => {
    const idsJson = await ls.getItem(CHAT_IDS_KEY);
    return idsJson ? (JSON.parse(idsJson) as string[]) : [];
  }, []);

  const saveChatIds = useCallback(async (ids: string[]) => {
    await ls.setItem(CHAT_IDS_KEY, JSON.stringify(ids));
  }, []);

  const createChat = useCallback(async (modelId: string): Promise<string> => {
    const id = generateId();
    const newChatData: ChatData = {
      id,
      messages: [],
      title: "New chat",
      modelId,
      createdAt: Date.now(),
    };

    ls.setItem(getChatKey(id), JSON.stringify(newChatData));
    setChats((prev) => [
      {
        id,
        title: newChatData.title,
        modelId: newChatData.modelId,
        createdAt: newChatData.createdAt,
      },
      ...prev,
    ]);

    (async () => {
      try {
        const idsJson = await ls.getItem(CHAT_IDS_KEY);
        const ids: string[] = idsJson ? JSON.parse(idsJson) : [];
        if (!ids.includes(id)) {
          await ls.setItem(CHAT_IDS_KEY, JSON.stringify([id, ...ids]));
        }
      } catch (error) {
        logger.error(`Failed to update chat IDs for new chat ${id}`, error);
      }
    })();

    return id;
  }, []);

  const saveChat = useCallback(
    async (chatData: Pick<ChatData, "id" | "messages"> & Partial<ChatData>) => {
      try {
        const existingData = await loadChat(chatData.id);
        const dataToSave = { ...existingData, ...chatData } as ChatData;
        await ls.setItem(getChatKey(chatData.id), JSON.stringify(dataToSave));
      } catch (error) {
        logger.error(`Failed to save chat ${chatData.id}`, error);
      }
    },
    [loadChat],
  );

  const updateChatTitle = useCallback(
    async (chatId: string, title: string) => {
      try {
        const existingData = await loadChat(chatId);
        if (existingData) {
          const updatedData: ChatData = {
            ...existingData,
            title,
            titleState: "generated",
          };
          await ls.setItem(getChatKey(chatId), JSON.stringify(updatedData));
          setChats((prev) =>
            prev.map((c) => (c.id === chatId ? { ...c, title } : c)),
          );
        }
      } catch (error) {
        logger.error(`Failed to save chat title ${chatId}`, error);
      }
    },
    [loadChat],
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      await ls.removeItem(getChatKey(chatId));
      const ids = await getChatIds();
      const newIds = ids.filter((id) => id !== chatId);
      await saveChatIds(newIds);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    },
    [getChatIds, saveChatIds],
  );

  const forkChat = useCallback(
    async (originalChatId: string, forkFromMessageId: string) => {
      const originalChatData = await loadChat(originalChatId);
      if (!originalChatData) {
        logger.error(`Fork failed: Original chat ${originalChatId} not found.`);
        return null;
      }

      const forkIndex = originalChatData.messages.findIndex(
        (m) => m.id === forkFromMessageId,
      );
      if (forkIndex === -1) {
        logger.error(
          `Fork failed: Message ${forkFromMessageId} not found in chat ${originalChatId}.`,
        );
        return null;
      }

      const forkedMessages = originalChatData.messages.slice(0, forkIndex + 1);
      const newId = await createChat(originalChatData.modelId || "");
      const newTitle = `Fork of ${originalChatData.title}`;

      const newChatData: Partial<ChatData> = {
        messages: forkedMessages,
        title: newTitle,
        titleState: "generated",
      };

      await saveChat({ id: newId, messages: forkedMessages, ...newChatData });
      await updateChatTitle(newId, newTitle);

      logger.verbose(`Chat ${originalChatId} forked to new chat ${newId}`);
      return newId;
    },
    [createChat, loadChat, saveChat, updateChatTitle],
  );

  const getNewChatModelId = useCallback(
    () => ls.getItem(NEW_CHAT_MODEL_ID_KEY),
    [],
  );
  const saveNewChatModelId = useCallback((modelId: string) => {
    ls.setItem(NEW_CHAT_MODEL_ID_KEY, modelId);
  }, []);

  const saveChatModel = useCallback(
    (chatId: string, modelId: string) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, modelId } : c)),
      );
      (async () => {
        const existing = await loadChat(chatId);
        if (existing) {
          await saveChat({ ...existing, modelId });
        }
      })();
    },
    [loadChat, saveChat],
  );

  const saveChatTitleState = useCallback(
    async (chatId: string, titleState: ChatData["titleState"]) => {
      const existing = await loadChat(chatId);
      if (existing) await saveChat({ ...existing, titleState });
    },
    [loadChat, saveChat],
  );

  const contextValue = useMemo(
    () => ({
      chats,
      isLoading,
      createChat,
      deleteChat,
      updateChatTitle,
      loadChat,
      saveChat,
      forkChat,
      getNewChatModelId,
      saveNewChatModelId,
      saveChatModel,
      saveChatTitleState,
    }),
    [
      chats,
      isLoading,
      createChat,
      deleteChat,
      updateChatTitle,
      loadChat,
      saveChat,
      forkChat,
      getNewChatModelId,
      saveNewChatModelId,
      saveChatModel,
      saveChatTitleState,
    ],
  );

  return (
    <PersistenceContext.Provider value={contextValue}>
      {children}
    </PersistenceContext.Provider>
  );
};
