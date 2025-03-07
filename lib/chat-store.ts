"use server";
import { Message } from "@ai-sdk/react";
import { generateId } from "ai";
import { existsSync, mkdirSync, readdirSync } from "fs";
import { readFile, writeFile } from "fs/promises";
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
    const files = readdirSync(CHAT_DIR);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.slice(0, -5));
  } catch (error) {
    console.error("Error getting all chat IDs:", error);
    return [];
  }
}
