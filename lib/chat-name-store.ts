"use server";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const CHAT_NAMES_FILE = "db/agent_one_chat_names.json";

interface ChatNames {
  [chatId: string]: string;
}

async function loadChatNames(): Promise<ChatNames> {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(CHAT_NAMES_FILE);
    if (!existsSync(dirPath)) {
      console.log("Creating directory for chat names:", dirPath);
      mkdirSync(dirPath, { recursive: true });
    }

    if (!existsSync(CHAT_NAMES_FILE)) {
      console.log("Chat names file does not exist, creating empty file");
      writeFileSync(CHAT_NAMES_FILE, "{}");
      return {};
    }

    console.log("Loading chat names from:", CHAT_NAMES_FILE);
    const data = readFileSync(CHAT_NAMES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading chat names:", error);
    return {};
  }
}

async function saveChatNames(chatNames: ChatNames): Promise<void> {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(CHAT_NAMES_FILE);
    if (!existsSync(dirPath)) {
      console.log("Creating directory for chat names:", dirPath);
      mkdirSync(dirPath, { recursive: true });
    }

    console.log("Saving chat names to:", CHAT_NAMES_FILE);
    writeFileSync(CHAT_NAMES_FILE, JSON.stringify(chatNames, null, 2));
  } catch (error) {
    console.error("Error saving chat names:", error);
  }
}

export async function getChatName(chatId: string): Promise<string | undefined> {
  const chatNames = await loadChatNames();
  return chatNames[chatId];
}

export async function setChatName(
  chatId: string,
  chatName: string,
): Promise<void> {
  const chatNames = await loadChatNames();
  chatNames[chatId] = chatName;
  await saveChatNames(chatNames);
}
