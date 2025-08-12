import type { UIMessage } from "ai";
import { generateId } from "ai";

const CHAT_IDS_KEY = "chat-ids";

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
    localStorage.setItem(chatKey, JSON.stringify([]));
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
  try {
    const chatKey = getChatKey(id);
    const chatJson = localStorage.getItem(chatKey);
    if (chatJson) {
      return JSON.parse(chatJson);
    }
    console.warn(`No chat found for id: ${id}`);
    return [];
  } catch (error) {
    console.error(`Failed to load chat ${id} from localStorage`, error);
    return [];
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
    const content = JSON.stringify(messages);
    localStorage.setItem(chatKey, content);
    window.dispatchEvent(
      new CustomEvent("persistence:chat-updated", {
        detail: { chatId, messages },
      }),
    );
  } catch (error) {
    console.error(`Failed to save chat ${chatId} to localStorage`, error);
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
