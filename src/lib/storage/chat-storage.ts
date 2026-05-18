import Database from "@tauri-apps/plugin-sql";
import type { UIMessage } from "ai";

import type { ChatMetadata } from "@/contexts/use-persistence/persistence-context";
import { getLogger } from "@/lib/logger";
import type { ChatSortOption } from "@/lib/settings/types";

export interface ChatSearchResult {
  chatId: string;
  title: string;
  snippet: string;
}

export interface StoredChat {
  id: string;
  metadata: ChatMetadata;
}

const logger = getLogger(import.meta.url);

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

async function getDb(): Promise<Database> {
  if (db) {
    return db;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const instance = await Database.load("sqlite:agent-one.db");
      await instance.execute("PRAGMA busy_timeout = 5000", []);
      await instance.execute("PRAGMA journal_mode = WAL", []);
      db = instance;
      return instance;
    })().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

async function enqueueWrite<T>(operation: (database: Database) => Promise<T>): Promise<T> {
  const next = writeQueue.then(async () => operation(await getDb()));
  writeQueue = next.then(
    () => undefined,
    (error) => {
      logger.error("Chat storage write failed", error);
    },
  );
  return next;
}

function trimSnippetLeft(snippet: string, maxLeftTokens: number): string {
  const markIdx = snippet.indexOf("<mark>");
  if (markIdx <= 0) return snippet;
  const left = snippet.slice(0, markIdx);
  const words = left.split(/\s+/).filter(Boolean);
  if (words.length <= maxLeftTokens) return snippet;
  return "…" + words.slice(-maxLeftTokens).join(" ") + " " + snippet.slice(markIdx);
}

function extractTextFromMessages(messages: UIMessage[]): string {
  const parts: string[] = [];
  for (const msg of messages) {
    for (const part of msg.parts ?? []) {
      if (part.type === "text" && part.text) {
        parts.push(part.text);
      }
    }
  }
  return parts.join(" ");
}

async function replaceFtsEntry(
  d: Database,
  id: string,
  title: string,
  content: string,
): Promise<void> {
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
    await enqueueWrite((d) =>
      d.execute(
        "INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = $2",
        [key, value],
      ),
    );
  },

  async removeItem(key: string): Promise<void> {
    await enqueueWrite((d) => d.execute("DELETE FROM kv WHERE key = $1", [key]));
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
        created_at: number | null;
        updated_at: number | null;
      }[]
    >(
      `SELECT title, title_state, model_id, model_config, branch_of, created_at, updated_at
       FROM chat_metadata
       WHERE id = $1`,
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
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
    };
  },

  async setChatMetadata(id: string, metadata: ChatMetadata): Promise<void> {
    await enqueueWrite((d) =>
      d.execute(
        `INSERT INTO chat_metadata (
           id,
           title,
           title_state,
           model_id,
           model_config,
           branch_of,
           created_at,
           updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(id) DO UPDATE SET
            title = $2,
            title_state = $3,
            model_id = $4,
            model_config = $5,
            branch_of = $6,
            created_at = COALESCE(chat_metadata.created_at, excluded.created_at),
            updated_at = COALESCE(excluded.updated_at, chat_metadata.updated_at)`,
        [
          id,
          metadata.title,
          metadata.titleState ?? null,
          metadata.modelId ?? null,
          metadata.modelConfig ? JSON.stringify(metadata.modelConfig) : null,
          metadata.branchOf ?? null,
          metadata.createdAt ?? null,
          metadata.updatedAt ?? null,
        ],
      ),
    );
  },

  async listChats(sortBy: ChatSortOption): Promise<StoredChat[]> {
    const d = await getDb();
    const sortColumn =
      sortBy === "updated-at"
        ? "COALESCE(updated_at, created_at, 0)"
        : "COALESCE(created_at, updated_at, 0)";
    const rows = await d.select<
      {
        id: string;
        title: string;
        title_state: string | null;
        model_id: string | null;
        model_config: string | null;
        branch_of: string | null;
        created_at: number | null;
        updated_at: number | null;
      }[]
    >(
      `SELECT id, title, title_state, model_id, model_config, branch_of, created_at, updated_at
       FROM chat_metadata
       ORDER BY ${sortColumn} DESC, id DESC`,
      [],
    );

    return rows.map((row) => ({
      id: row.id,
      metadata: {
        title: row.title,
        titleState: row.title_state as ChatMetadata["titleState"],
        modelId: row.model_id ?? undefined,
        modelConfig: row.model_config ? JSON.parse(row.model_config) : undefined,
        branchOf: row.branch_of ?? undefined,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
      },
    }));
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
    await enqueueWrite((d) =>
      d.execute(
        `INSERT INTO chat_messages (id, messages) VALUES ($1, $2)
         ON CONFLICT(id) DO UPDATE SET messages = $2`,
        [id, JSON.stringify(messages)],
      ),
    );
  },

  async deleteChat(id: string): Promise<void> {
    await enqueueWrite(async (d) => {
      await d.execute("DELETE FROM chat_metadata WHERE id = $1", [id]);
      await d.execute("DELETE FROM chat_messages WHERE id = $1", [id]);
      await d.execute("DELETE FROM chat_fts WHERE chat_id = $1", [id]);
    });
  },

  async bulkDeleteChats(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
    await enqueueWrite(async (d) => {
      await d.execute(`DELETE FROM chat_metadata WHERE id IN (${placeholders})`, ids);
      await d.execute(`DELETE FROM chat_messages WHERE id IN (${placeholders})`, ids);
      await d.execute(`DELETE FROM chat_fts WHERE chat_id IN (${placeholders})`, ids);
    });
  },

  async updateFtsIndex(id: string, title: string, messages: UIMessage[]): Promise<void> {
    const content = extractTextFromMessages(messages);
    await enqueueWrite((d) => replaceFtsEntry(d, id, title, content));
  },

  async updateFtsTitle(id: string, title: string): Promise<void> {
    await enqueueWrite((d) =>
      d.execute("UPDATE chat_fts SET title = $1 WHERE chat_id = $2", [title, id]),
    );
  },

  async performStartupMaintenance(): Promise<void> {
    logger.verbose("Starting chat storage startup maintenance");
    await enqueueWrite(async (d) => {
      await d.execute("PRAGMA optimize", []);
    });
    logger.verbose("Finished chat storage startup maintenance");
  },

  async vacuum(): Promise<void> {
    logger.verbose("Running VACUUM to reclaim unused space");
    await enqueueWrite(async (d) => {
      await d.execute("VACUUM", []);
    });
    logger.verbose("VACUUM completed");
  },

  async ensureSearchIndexConsistency(): Promise<void> {
    logger.verbose("Checking chat search index consistency");
    const d = await getDb();
    const [chatCountRow] = await d.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM chat_messages",
      [],
    );
    const [ftsCountRow] = await d.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM chat_fts",
      [],
    );
    const [missingFtsRow] = await d.select<{ count: number }[]>(
      `SELECT COUNT(*) as count
       FROM chat_messages m
       LEFT JOIN chat_fts f ON f.chat_id = m.id
       WHERE f.chat_id IS NULL`,
      [],
    );
    const [staleFtsRow] = await d.select<{ count: number }[]>(
      `SELECT COUNT(*) as count
       FROM chat_fts f
       LEFT JOIN chat_messages m ON m.id = f.chat_id
       WHERE m.id IS NULL`,
      [],
    );
    const [duplicateFtsRow] = await d.select<{ count: number }[]>(
      `SELECT COUNT(*) as count
       FROM (
         SELECT chat_id
         FROM chat_fts
         GROUP BY chat_id
         HAVING COUNT(*) > 1
       )`,
      [],
    );

    const chatCount = chatCountRow?.count ?? 0;
    const ftsCount = ftsCountRow?.count ?? 0;
    const missingFtsCount = missingFtsRow?.count ?? 0;
    const staleFtsCount = staleFtsRow?.count ?? 0;
    const duplicateFtsCount = duplicateFtsRow?.count ?? 0;

    logger.verbose("Chat search index consistency stats:", {
      chatCount,
      ftsCount,
      missingFtsCount,
      staleFtsCount,
      duplicateFtsCount,
    });

    if (
      chatCount === ftsCount &&
      missingFtsCount === 0 &&
      staleFtsCount === 0 &&
      duplicateFtsCount === 0
    ) {
      logger.verbose("Chat search index is consistent");
      return;
    }

    logger.warn("Chat search index is inconsistent, rebuilding", {
      chatCount,
      ftsCount,
      missingFtsCount,
      staleFtsCount,
      duplicateFtsCount,
    });
    await chatStorage.rebuildFtsIndex();
    logger.verbose("Finished rebuilding inconsistent chat search index");
  },

  async searchChats(query: string, rawOperators = false): Promise<ChatSearchResult[]> {
    const d = await getDb();
    let ftsQuery: string;
    if (rawOperators) {
      ftsQuery = query.trim();
    } else {
      ftsQuery = query
        .replace(/"/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .map((term) => `"${term}"*`)
        .join(" ");
    }
    if (!ftsQuery) return [];
    const rows = await d.select<{ chat_id: string; title: string; snippet: string }[]>(
      `SELECT
         chat_fts.chat_id,
         chat_metadata.title,
         snippet(chat_fts, 2, '<mark>', '</mark>', '…', 12) AS snippet
       FROM chat_fts
       JOIN chat_metadata ON chat_metadata.id = chat_fts.chat_id
       WHERE chat_fts MATCH $1
       ORDER BY bm25(chat_fts, 0, 10.0, 1.0)
       LIMIT 50`,
      [ftsQuery],
    );
    const seen = new Set<string>();
    const results: ChatSearchResult[] = [];
    for (const r of rows) {
      if (seen.has(r.chat_id)) continue;
      seen.add(r.chat_id);
      results.push({ chatId: r.chat_id, title: r.title, snippet: trimSnippetLeft(r.snippet, 2) });
    }
    return results;
  },

  async rebuildFtsIndex(): Promise<void> {
    logger.verbose("Rebuilding chat search index");
    await enqueueWrite(async (d) => {
      const rows = await d.select<{ id: string; title: string; messages: string }[]>(
        "SELECT m.id, COALESCE(c.title, 'New chat') as title, m.messages FROM chat_messages m LEFT JOIN chat_metadata c ON c.id = m.id",
        [],
      );
      let malformedEntries = 0;
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
          malformedEntries += 1;
          // skip malformed entries
        }
      }

      logger.verbose("Finished rebuilding chat search index", {
        indexedChats: rows.length - malformedEntries,
        malformedEntries,
      });
    });
  },
};
