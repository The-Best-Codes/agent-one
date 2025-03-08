"use server";
import { Message } from "@ai-sdk/react";
import { generateId } from "ai";
import { existsSync, mkdirSync } from "fs";
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";

const CHAT_DIR = "db/chats"; // TODO: Check Windows and macOS compatibility

function getChatFile(id: string): string {
  if (!existsSync(CHAT_DIR)) {
    mkdirSync(CHAT_DIR, { recursive: true });
  }
  return path.join(CHAT_DIR, `${id}.json`);
}

export async function createChat(): Promise<string> {
  const id = generateId();
  await writeFile(getChatFile(id), "[]");
  return id;
}

export async function loadChat(id: string): Promise<Message[]> {
  try {
    const data = await readFile(getChatFile(id), "utf8");
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
        try {
          const chatFilePath = path.join(CHAT_DIR, file);
          const chatData = await readFile(chatFilePath, "utf8");
          const messages: Message[] = JSON.parse(chatData);

          // Check if the chat has at least one message and it has a createdAt property
          if (messages?.length > 0 && messages[0]?.createdAt) {
            return {
              id: chatId,
              createdAt: new Date(messages[0]?.createdAt as unknown as string),
            };
          } else {
            // If createdAt doesn't exist or no messages, use file creation time as fallback
            const stats = await require("fs").promises.stat(chatFilePath); // Importing fs.promises here as readdir is already async
            return { id: chatId, createdAt: stats.birthtime };
          }
        } catch (error) {
          console.error(`Error reading chat file ${file}:`, error);
          // Return null for files that can't be read, to be filtered later
          return null;
        }
      }),
    );

    // Filter out null results (files that couldn't be read)
    const validChatIdsWithDates = chatIdsWithDates.filter(
      (chatIdWithDate) => chatIdWithDate !== null,
    ) as { id: string; createdAt: Date }[];

    // Sort by createdAt in descending order (newest first)
    validChatIdsWithDates.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    // Extract only the chat IDs
    return validChatIdsWithDates.map((chatIdWithDate) => chatIdWithDate.id);
  } catch (error) {
    console.error("Error getting all chat IDs:", error);
    return [];
  }
}
