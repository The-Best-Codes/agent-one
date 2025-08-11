import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UIMessage } from "ai";
import { generateId } from "ai";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Chat Persistence Logic ---
// Using localStorage for client-side chat persistence.

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
    localStorage.setItem(chatKey, "[]"); // create empty chat
    const currentIds = listChatIds();
    saveChatIds([id, ...currentIds]);
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
  } catch (error) {
    console.error(`Failed to save chat ${chatId} to localStorage`, error);
  }
}
