import type { UIMessage } from "ai";
import { generateId } from "ai";

const CHAT_IDS_KEY = "chat-ids";

export interface ChatData {
  messages: UIMessage[];
  title: string;
}

function getChatKey(id: string): string {
  return `chat-${id}`;
}

export function listChatIds(): string[] {
  try {
    const idsJson = localStorage.getItem(CHAT_IDS_KEY);
    return idsJson ? JSON.parse(idsJson) : [];
  } catch (error) {
    console.error("Failed to list chat IDs from localStorage", error);
    return [];
  }
}

function saveChatIds(ids: string[]): void {
  try {
    localStorage.setItem(CHAT_IDS_KEY, JSON.stringify(ids));
  } catch (error) {
    console.error("Failed to save chat IDs to localStorage", error);
  }
}

export function createChat(): string {
  const id = generateId();
  try {
    const chatKey = getChatKey(id);
    const chatData: ChatData = { messages: [], title: "New chat" };
    localStorage.setItem(chatKey, JSON.stringify(chatData));
    const currentIds = listChatIds();
    saveChatIds([id, ...currentIds]);
    window.dispatchEvent(
      new CustomEvent("persistence:chat-created", { detail: { chatId: id } }),
    );
    return id;
  } catch (error) {
    console.error("Failed to create chat in localStorage", error);
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
    console.warn(`No chat found for id: ${id}`);
    return { messages: [], title: "New chat" };
  } catch (error) {
    console.error(`Failed to load chat ${id} from localStorage`, error);
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
    window.dispatchEvent(
      new CustomEvent("persistence:chat-updated", {
        detail: { chatId, messages, chatData },
      }),
    );
  } catch (error) {
    console.error(`Failed to save chat ${chatId} to localStorage`, error);
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
    };
    const content = JSON.stringify(chatData);
    localStorage.setItem(chatKey, content);
    window.dispatchEvent(
      new CustomEvent("persistence:chat-title-updated", {
        detail: { chatId, title },
      }),
    );
  } catch (error) {
    console.error(`Failed to save chat title ${chatId} to localStorage`, error);
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
    console.error(`Failed to delete chat ${chatId} from localStorage`, error);
  }
}
