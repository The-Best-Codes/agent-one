"use server";
import { existsSync, readFileSync, writeFileSync } from "fs";

const CHAT_NAMES_FILE = "db/agent_one_chat_names.json";

interface ChatNames {
  [chatId: string]: string;
}

async function loadChatNames(): Promise<ChatNames> {
  try {
    if (!existsSync(CHAT_NAMES_FILE)) {
      return {};
    }
    const data = readFileSync(CHAT_NAMES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading chat names:", error);
    return {};
  }
}

async function saveChatNames(chatNames: ChatNames): Promise<void> {
  try {
    writeFileSync(CHAT_NAMES_FILE, JSON.stringify(chatNames, null, 2));
  } catch (error) {
    console.error("Error saving chat names:", error);
  }
}

export async function getChatName(chatId: string): Promise<string | undefined> {
  const chatNames = await loadChatNames();
  return chatNames[chatId];
}

export async function setChatName(chatId: string, chatName: string): Promise<void> {
  const chatNames = await loadChatNames();
  chatNames[chatId] = chatName;
  await saveChatNames(chatNames);
}
