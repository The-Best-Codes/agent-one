import type { UIMessage } from "ai";
import { generateId } from "ai";

import { getLogger } from "../../logger";

const CHAT_IDS_KEY = "chat-ids";
const NEW_CHAT_MODEL_ID_KEY = "new-chat-model-id";

const logger = getLogger(import.meta.url);

export interface ChatData {
  messages: UIMessage[];
  title: string;
  titleState?: "generating" | "generated" | "error";
  modelId?: string;
}

export function getNewChatModelId(): string | null {
  try {
    return localStorage.getItem(NEW_CHAT_MODEL_ID_KEY);
  } catch (error) {
    logger.error("Failed to get new chat model ID from localStorage", error);
    return null;
  }
}

export function saveNewChatModelId(modelId: string): void {
  try {
    localStorage.setItem(NEW_CHAT_MODEL_ID_KEY, modelId);
  } catch (error) {
    logger.error("Failed to save new chat model ID to localStorage", error);
  }
}

function getChatKey(id: string): string {
  return `chat-${id}`;
}

export function listChatIds(): string[] {
  try {
    const idsJson = localStorage.getItem(CHAT_IDS_KEY);
    return idsJson ? JSON.parse(idsJson) : [];
  } catch (error) {
    logger.error("Failed to list chat IDs from localStorage", error);
    return [];
  }
}

function saveChatIds(ids: string[]): void {
  try {
    localStorage.setItem(CHAT_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    logger.error("Failed to save chat IDs to localStorage", error);
  }
}

export function createChat(modelId: string): string {
  const id = generateId();
  try {
    const chatKey = getChatKey(id);
    const chatData: ChatData = {
      messages: [],
      title: "New chat",
      titleState: undefined,
      modelId,
    };
    localStorage.setItem(chatKey, JSON.stringify(chatData));
    const currentIds = listChatIds();
    saveChatIds([id, ...currentIds]);
    window.dispatchEvent(
      new CustomEvent("persistence:chat-created", { detail: { chatId: id } }),
    );
    return id;
  } catch (error) {
    logger.error("Failed to create chat in localStorage", error);
    throw new Error("Failed to create new chat in localStorage.");
  }
}

export function loadChat(id: string): UIMessage[] {
  const chatData = loadChatData(id);
  return chatData.messages;
}

export function loadChatData(id: string): ChatData {
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
}

export function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): void {
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
}

export function saveChatModel({
  chatId,
  modelId,
}: {
  chatId: string;
  modelId: string;
}): void {
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
    logger.error(`Failed to save chat model ${chatId} to localStorage`, error);
  }
}

export function saveChatTitleState({
  chatId,
  titleState,
}: {
  chatId: string;
  titleState: "generating" | "generated" | "error";
}): void {
  try {
    const chatKey = getChatKey(chatId);
    const existingData = loadChatData(chatId);
    const chatData: ChatData = {
      ...existingData,
      titleState,
    };
    const content = JSON.stringify(chatData);
    localStorage.setItem(chatKey, content);
  } catch (error) {
    logger.error(
      `Failed to save chat title state ${chatId} to localStorage`,
      error,
    );
  }
}

export function saveChatTitle({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}): void {
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
    window.dispatchEvent(
      new CustomEvent("persistence:chat-title-updated", {
        detail: { chatId, title },
      }),
    );
  } catch (error) {
    logger.error(`Failed to save chat title ${chatId} to localStorage`, error);
  }
}

export function deleteChat(chatId: string): void {
  try {
    const chatKey = getChatKey(chatId);
    localStorage.removeItem(chatKey);

    const ids = listChatIds();
    const newIds = ids.filter((id) => id !== chatId);
    saveChatIds(newIds);

    window.dispatchEvent(
      new CustomEvent("persistence:chat-deleted", { detail: { chatId } }),
    );
  } catch (error) {
    logger.error(`Failed to delete chat ${chatId} from localStorage`, error);
  }
}
