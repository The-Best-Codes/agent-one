import Database from "@tauri-apps/plugin-sql";
import type { UIMessage } from "ai";

import type { ChatMetadata } from "@/contexts/use-persistence/persistence-context";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:agent-one.db");
  }
  return db;
}

export const chatStorage = {
  async getItem(key: string): Promise<string | null> {
    const d = await getDb();
    const rows = await d.select<{ value: string }[]>("SELECT value FROM kv WHERE key = $1", [key]);
    return rows.length > 0 ? rows[0].value : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const d = await getDb();
    await d.execute(
      "INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2",
      [key, value],
    );
  },

  async removeItem(key: string): Promise<void> {
    const d = await getDb();
    await d.execute("DELETE FROM kv WHERE key = $1", [key]);
  },

  async getChatMetadata(id: string): Promise<ChatMetadata | null> {
    const d = await getDb();
    const rows = await d.select<
      {
        title: string;
        title_state: string | null;
        model_id: string | null;
        model_config: string | null;
        branch_of: string | null;
        input_tokens: number | null;
        output_tokens: number | null;
        total_cost_usd: number | null;
      }[]
    >(
      "SELECT title, title_state, model_id, model_config, branch_of, input_tokens, output_tokens, total_cost_usd FROM chat_metadata WHERE id = $1",
      [id],
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      title: row.title,
      titleState: row.title_state as ChatMetadata["titleState"],
      modelId: row.model_id ?? undefined,
      modelConfig: row.model_config ? JSON.parse(row.model_config) : undefined,
      branchOf: row.branch_of ?? undefined,
      inputTokens: row.input_tokens ?? undefined,
      outputTokens: row.output_tokens ?? undefined,
      totalCostUsd: row.total_cost_usd ?? undefined,
    };
  },

  async setChatMetadata(id: string, metadata: ChatMetadata): Promise<void> {
    const d = await getDb();
    await d.execute(
      `INSERT INTO chat_metadata (
         id,
         title,
         title_state,
         model_id,
         model_config,
         branch_of,
         input_tokens,
         output_tokens,
         total_cost_usd
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT(id) DO UPDATE SET
         title = $2,
         title_state = $3,
         model_id = $4,
         model_config = $5,
         branch_of = $6,
         input_tokens = $7,
         output_tokens = $8,
         total_cost_usd = $9`,
      [
        id,
        metadata.title,
        metadata.titleState ?? null,
        metadata.modelId ?? null,
        metadata.modelConfig ? JSON.stringify(metadata.modelConfig) : null,
        metadata.branchOf ?? null,
        metadata.inputTokens ?? null,
        metadata.outputTokens ?? null,
        metadata.totalCostUsd ?? null,
      ],
    );
  },

  async getChatMessages(id: string): Promise<UIMessage[] | null> {
    const d = await getDb();
    const rows = await d.select<{ messages: string }[]>(
      "SELECT messages FROM chat_messages WHERE id = $1",
      [id],
    );
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].messages);
  },

  async setChatMessages(id: string, messages: UIMessage[]): Promise<void> {
    const d = await getDb();
    await d.execute(
      `INSERT INTO chat_messages (id, messages) VALUES ($1, $2)
       ON CONFLICT(id) DO UPDATE SET messages = $2`,
      [id, JSON.stringify(messages)],
    );
  },

  async deleteChat(id: string): Promise<void> {
    const d = await getDb();
    await d.execute("DELETE FROM chat_metadata WHERE id = $1", [id]);
    await d.execute("DELETE FROM chat_messages WHERE id = $1", [id]);
  },

  async bulkDeleteChats(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const d = await getDb();
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await d.execute(`DELETE FROM chat_metadata WHERE id IN (${placeholders})`, ids);
    await d.execute(`DELETE FROM chat_messages WHERE id IN (${placeholders})`, ids);
  },
};
