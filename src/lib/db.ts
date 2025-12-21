import Database from "@tauri-apps/plugin-sql";
import type { UIMessage } from "ai";

import type { ModelConfig } from "@/lib/ai/models";

export interface ChatRecord {
  id: string;
  title: string;
  messages: UIMessage[];
  modelId: string;
  modelConfig: ModelConfig;
  createdAt: number;
  updatedAt: number;
  branchOf?: string;
  titleState?: "generating" | "generated" | "error";
}

// Interface for SQL row result (snake_case)
interface ChatRow {
  id: string;
  title: string;
  messages: string; // JSON string
  model_id: string;
  model_config: string; // JSON string
  created_at: number;
  updated_at: number;
  branch_of?: string | null;
  title_state?: string | null;
}

// Helper to delay a promise result (Latency Simulator)
const ARTIFICIAL_LATENCY_MS = 0; // Set to 1000 for testing

const delay = <T>(promise: Promise<T>): Promise<T> => {
  if (ARTIFICIAL_LATENCY_MS === 0) return promise;
  return promise.then((result) => {
    return new Promise<T>((resolve) => {
      setTimeout(() => resolve(result), ARTIFICIAL_LATENCY_MS);
    });
  });
};

class AgentOneSqlite {
  private dbPromise: Promise<Database> | null = null;

  private async getDb(): Promise<Database> {
    if (!this.dbPromise) {
      this.dbPromise = Database.load("sqlite:agent_one.db");
    }
    return this.dbPromise;
  }

  async getChat(id: string): Promise<ChatRecord | undefined> {
    const db = await this.getDb();
    const result = await delay(
      db.select<ChatRow[]>("SELECT * FROM chats WHERE id = $1", [id]),
    );

    if (result.length === 0) return undefined;
    return this.mapRowToRecord(result[0]);
  }

  async getAllChats(): Promise<ChatRecord[]> {
    const db = await this.getDb();
    const result = await delay(
      db.select<ChatRow[]>("SELECT * FROM chats ORDER BY updated_at DESC"),
    );
    return result.map(this.mapRowToRecord);
  }

  async createChat(record: ChatRecord): Promise<void> {
    const db = await this.getDb();
    await delay(
      db.execute(
        `INSERT INTO chats (id, title, messages, model_id, model_config, created_at, updated_at, branch_of, title_state) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          record.id,
          record.title,
          JSON.stringify(record.messages),
          record.modelId,
          JSON.stringify(record.modelConfig),
          record.createdAt,
          record.updatedAt,
          record.branchOf || null,
          record.titleState || null,
        ],
      ),
    );
  }

  async updateChat(id: string, updates: Partial<ChatRecord>): Promise<void> {
    const db = await this.getDb();

    // Dynamic query building is risky with raw SQL, but we have a fixed schema.
    // We'll handle specific update cases commonly used in the app.

    // 1. Update Messages & Timestamp
    if (updates.messages) {
      await delay(
        db.execute(
          "UPDATE chats SET messages = $1, updated_at = $2 WHERE id = $3",
          [
            JSON.stringify(updates.messages),
            updates.updatedAt || Date.now(),
            id,
          ],
        ),
      );
    }

    // 2. Update Title
    if (updates.title) {
      await delay(
        db.execute(
          "UPDATE chats SET title = $1, title_state = $2, updated_at = $3 WHERE id = $4",
          [
            updates.title,
            updates.titleState || null,
            updates.updatedAt || Date.now(),
            id,
          ],
        ),
      );
    }

    // 3. Update Title State Only
    if (updates.titleState && !updates.title) {
      await delay(
        db.execute("UPDATE chats SET title_state = $1 WHERE id = $2", [
          updates.titleState,
          id,
        ]),
      );
    }

    // 4. Update Model
    if (updates.modelId) {
      await delay(
        db.execute(
          "UPDATE chats SET model_id = $1, updated_at = $2 WHERE id = $3",
          [updates.modelId, updates.updatedAt || Date.now(), id],
        ),
      );
    }

    // 5. Update Config
    if (updates.modelConfig) {
      await delay(
        db.execute(
          "UPDATE chats SET model_config = $1, updated_at = $2 WHERE id = $3",
          [
            JSON.stringify(updates.modelConfig),
            updates.updatedAt || Date.now(),
            id,
          ],
        ),
      );
    }
  }

  async deleteChat(id: string): Promise<void> {
    const db = await this.getDb();
    await delay(db.execute("DELETE FROM chats WHERE id = $1", [id]));
  }

  // Helper to convert Snake_Case SQL result to CamelCase TS Object
  private mapRowToRecord(row: ChatRow): ChatRecord {
    return {
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      modelId: row.model_id,
      modelConfig: JSON.parse(row.model_config),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      branchOf: row.branch_of || undefined,
      titleState:
        (row.title_state as "generating" | "generated" | "error") || undefined,
    };
  }
}

export const db = new AgentOneSqlite();
