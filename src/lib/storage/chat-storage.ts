import Database from "@tauri-apps/plugin-sql";
import type { UIMessage } from "ai";

import type { ChatMetadata } from "@/contexts/use-persistence/persistence-context";

export interface ChatSearchResult {
  chatId: string;
  title: string;
  snippet: string;
}

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:agent-one.db");
  }
  return db;
}

function extractTextFromMessages(messages: UIMessage[]): string {
  const parts: string[] = [];
  for (const msg of messages) {
    for (const part of msg.parts) {
      if (part.type === "text" && part.text) {
        parts.push(part.text);
      }
    }
  }
  return parts.join(" ");
}

async function replaceFtsEntry(id: string, title: string, content: string): Promise<void> {
  const d = await getDb();
  await d.execute("DELETE FROM chat_fts WHERE chat_id = $1", [id]);
  await d.execute("INSERT INTO chat_fts (chat_id, title, content) VALUES ($1, $2, $3)", [
    id,
    title,
    content,
  ]);
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
    await d.execute("DELETE FROM chat_fts WHERE chat_id = $1", [id]);
  },

  async bulkDeleteChats(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const d = await getDb();
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await d.execute(`DELETE FROM chat_metadata WHERE id IN (${placeholders})`, ids);
    await d.execute(`DELETE FROM chat_messages WHERE id IN (${placeholders})`, ids);
    await d.execute(`DELETE FROM chat_fts WHERE chat_id IN (${placeholders})`, ids);
  },

  async updateFtsIndex(id: string, title: string, messages: UIMessage[]): Promise<void> {
    const content = extractTextFromMessages(messages);
    await replaceFtsEntry(id, title, content);
  },

  async isFtsIndexConsistent(): Promise<boolean> {
    const d = await getDb();
    const [chatCountRow] = await d.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM chat_messages",
      [],
    );
    const [ftsCountRow] = await d.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM chat_fts",
      [],
    );

    return (chatCountRow?.count ?? 0) === (ftsCountRow?.count ?? 0);
  },

  async searchChats(query: string): Promise<ChatSearchResult[]> {
    const d = await getDb();
    const ftsQuery = query
      .replace(/"/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `"${term}"*`)
      .join(" ");
    if (!ftsQuery) return [];
    const rows = await d.select<{ chat_id: string; title: string; snippet: string }[]>(
      `SELECT
         chat_fts.chat_id,
         chat_metadata.title,
         snippet(chat_fts, 2, '<mark>', '</mark>', '…', 48) AS snippet
       FROM chat_fts
       JOIN chat_metadata ON chat_metadata.id = chat_fts.chat_id
       WHERE chat_fts MATCH $1
       ORDER BY bm25(chat_fts, 0, 10.0, 1.0)
       LIMIT 50`,
      [ftsQuery],
    );
    return rows.map((r) => ({ chatId: r.chat_id, title: r.title, snippet: r.snippet }));
  },

  async rebuildFtsIndex(): Promise<void> {
    const d = await getDb();
    const rows = await d.select<{ id: string; title: string; messages: string }[]>(
      "SELECT m.id, COALESCE(c.title, 'New chat') as title, m.messages FROM chat_messages m LEFT JOIN chat_metadata c ON c.id = m.id",
      [],
    );
    await d.execute("BEGIN TRANSACTION", []);
    try {
      await d.execute("DELETE FROM chat_fts", []);
      for (const row of rows) {
        try {
          const messages: UIMessage[] = JSON.parse(row.messages);
          const content = extractTextFromMessages(messages);
          await d.execute("INSERT INTO chat_fts (chat_id, title, content) VALUES ($1, $2, $3)", [
            row.id,
            row.title,
            content,
          ]);
        } catch {
          // skip malformed entries
        }
      }
      await d.execute("COMMIT", []);
    } catch (error) {
      await d.execute("ROLLBACK", []);
      throw error;
    }
  },
};
