import type { UIMessage } from "ai";
import Dexie, { type Table } from "dexie";

import type { ModelConfig } from "@/lib/ai/models";

export interface ChatRecord {
  id: string;
  title: string;
  messages: UIMessage[];
  modelId: string;
  modelConfig: ModelConfig;
  createdAt: number;
  updatedAt: number;
  branchOf?: string; // ID of parent chat
  titleState?: "generating" | "generated" | "error";
}

export class AgentOneDB extends Dexie {
  chats!: Table<ChatRecord, string>;

  constructor() {
    super("AgentOneDB");
    this.version(1).stores({
      // Primary key: id
      // Indexes: updatedAt (for sorting), branchOf (for tree view later)
      chats: "id, updatedAt, branchOf",
    });
  }
}

export const db = new AgentOneDB();
