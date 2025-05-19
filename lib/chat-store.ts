"use server";
import { Message } from "@ai-sdk/react";
import { generateId } from "ai";
import { existsSync, mkdirSync } from "fs";
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";

const CHAT_DIR = "db/chats"; // TODO: Check Windows and macOS compatibility

function getChatFile(id: string): string {
  if (!existsSync(CHAT_DIR)) {
    try {
      mkdirSync(CHAT_DIR, { recursive: true });
      console.log("Created chat directory:", CHAT_DIR);
    } catch (error) {
      console.error("Error creating chat directory:", error);
      throw new Error(
        `Failed to create chat directory: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return path.join(CHAT_DIR, `${id}.json`);
}

export async function createChat(): Promise<string> {
  const id = generateId();
  try {
    const filePath = getChatFile(id);
    await writeFile(filePath, "[]");
    console.log("Created chat file:", filePath);
    return id;
  } catch (error) {
    console.error("Error creating chat file:", error);
    throw new Error(
      `Failed to create chat: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function loadChat(id: string): Promise<Message[]> {
  try {
    const filePath = getChatFile(id);
    console.log("Loading chat from:", filePath);

    if (!existsSync(filePath)) {
      console.log("Chat file does not exist, creating empty file");
      await writeFile(filePath, "[]");
      return [];
    }

    const data = await readFile(filePath, "utf8");
    console.log("Chat file loaded successfully");
    return JSON.parse(data);
  } catch (error) {
    // Handle the case where the chat file doesn't exist (e.g., invalid ID)
    console.error("Error loading chat:", error);
    return []; // Or throw an error if you prefer
  }
}

export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(id), content);
}

export async function getAllChatIds(): Promise<string[]> {
  if (!existsSync(CHAT_DIR)) {
    return [];
  }

  try {
    const files = await readdir(CHAT_DIR);
    const chatFiles = files.filter((file) => file.endsWith(".json"));

    const chatIdsWithDates = await Promise.all(
      chatFiles.map(async (file) => {
        const chatId = file.slice(0, -5);
        const chatFilePath = path.join(CHAT_DIR, file);
        try {
          const stats = await require("fs").promises.stat(chatFilePath);
          return { id: chatId, lastModified: stats.mtime };
        } catch (error) {
          console.error(`Error reading chat file ${file}:`, error);
          return null;
        }
      }),
    );

    const validChatIdsWithDates = chatIdsWithDates.filter(
      (chatIdWithDate) => chatIdWithDate !== null,
    ) as { id: string; lastModified: Date }[];

    validChatIdsWithDates.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
    );

    return validChatIdsWithDates.map((chatIdWithDate) => chatIdWithDate.id);
  } catch (error) {
    console.error("Error getting all chat IDs:", error);
    return [];
  }
}
