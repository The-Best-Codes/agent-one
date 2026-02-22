import type { UIMessage } from "ai";
import Dexie from "dexie";

import type { ChatMetadata } from "@/contexts/use-persistence/persistence-context";

const SIMULATED_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface KVEntry {
  key: string;
  value: string;
}

interface ChatMetadataEntry extends ChatMetadata {
  id: string;
}

interface ChatMessagesEntry {
  id: string;
  messages: UIMessage[];
}

class AsyncStorageDB extends Dexie {
  kv!: Dexie.Table<KVEntry, string>;
  chatMetadata!: Dexie.Table<ChatMetadataEntry, string>;
  chatMessages!: Dexie.Table<ChatMessagesEntry, string>;

  constructor() {
    super("agent-one-storage");
    this.version(1).stores({
      kv: "key",
    });
    this.version(2).stores({
      kv: "key",
      chatMetadata: "id",
      chatMessages: "id",
    });
  }
}

const db = new AsyncStorageDB();

export const asyncLocalStorage = {
  async getItem(key: string): Promise<string | null> {
    await delay(SIMULATED_DELAY_MS);
    const entry = await db.kv.get(key);
    return entry?.value ?? null;
  },

  setItem(key: string, value: string): void {
    void delay(SIMULATED_DELAY_MS).then(() => db.kv.put({ key, value }));
  },

  removeItem(key: string): void {
    void delay(SIMULATED_DELAY_MS).then(() => db.kv.delete(key));
  },

  async getChatMetadata(id: string): Promise<ChatMetadata | null> {
    await delay(SIMULATED_DELAY_MS);
    const entry = await db.chatMetadata.get(id);
    if (!entry) return null;
    const { id: _id, ...metadata } = entry;
    void _id;
    return metadata;
  },

  setChatMetadata(id: string, metadata: ChatMetadata): void {
    void delay(SIMULATED_DELAY_MS).then(() =>
      db.chatMetadata.put({ id, ...metadata }),
    );
  },

  async getChatMessages(id: string): Promise<UIMessage[] | null> {
    await delay(SIMULATED_DELAY_MS);
    const entry = await db.chatMessages.get(id);
    return entry?.messages ?? null;
  },

  setChatMessages(id: string, messages: UIMessage[]): void {
    void delay(SIMULATED_DELAY_MS).then(() =>
      db.chatMessages.put({ id, messages }),
    );
  },

  deleteChat(id: string): void {
    void delay(SIMULATED_DELAY_MS).then(() =>
      Promise.all([db.chatMetadata.delete(id), db.chatMessages.delete(id)]),
    );
  },
};
