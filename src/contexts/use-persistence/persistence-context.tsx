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
  getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
};

interface PersistenceProviderProps {
  children: ReactNode;
}

export const PersistenceProvider: React.FC<PersistenceProviderProps> = ({
  children,
}) => {
  const [chats, setChats] = useState<ChatMetadata[]>([]);

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
        const loadedChats = await Promise.all(
          ids.map(async (id) => {
            const data = await loadChat(id);
            if (!data) return null;
            const metadata: ChatMetadata = {
              id,
              title: data.title,
              modelId: data.modelId,
              createdAt: data.createdAt,
            };
            return metadata;
          }),
        );

        const chatMetadataList = loadedChats.filter(
          (c): c is ChatMetadata => c !== null,
        );

        chatMetadataList.sort((a, b) => b.createdAt - a.createdAt);
        setChats(chatMetadataList);
      } catch (error) {
        logger.error("Failed to load initial chats", error);
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

  const createChat = useCallback(
    async (modelId: string): Promise<string> => {
      const id = generateId();
      const newChatData: ChatData = {
        id,
        messages: [],
        title: "New chat",
        modelId,
        createdAt: Date.now(),
      };

      await ls.setItem(getChatKey(id), JSON.stringify(newChatData));
      const currentIds = await getChatIds();
      await saveChatIds([id, ...currentIds]);

      setChats((prev) => [
        {
          id,
          title: newChatData.title,
          modelId: newChatData.modelId,
          createdAt: newChatData.createdAt,
        },
        ...prev,
      ]);

      return id;
    },
    [getChatIds, saveChatIds],
  );

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
    () => localStorage.getItem(NEW_CHAT_MODEL_ID_KEY),
    [],
  );
  const saveNewChatModelId = useCallback(
    (modelId: string) => localStorage.setItem(NEW_CHAT_MODEL_ID_KEY, modelId),
    [],
  );

  const saveChatModel = useCallback(
    async (chatId: string, modelId: string) => {
      const existing = await loadChat(chatId);
      if (existing) {
        await saveChat({ ...existing, modelId });
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, modelId } : c)),
        );
      }
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
