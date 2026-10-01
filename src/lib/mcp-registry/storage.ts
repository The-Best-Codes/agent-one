import Database from "@tauri-apps/plugin-sql";

import {
  createMcpRegistryExtension,
  createMcpRegistrySummary,
  createSearchText,
  type McpRegistrySummary,
} from "./install";
import { mcpRegistryEntrySchema, type MCPRegistryEntry } from "./types";

let databasePromise: Promise<Database> | null = null;

async function getDatabase(): Promise<Database> {
  databasePromise ??= Database.load("sqlite:mcp-registry.db").catch((error) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

export interface RegistrySyncState {
  initial_complete: number;
  last_success: number;
  checkpoint: string | null;
  pending_since: string | null;
  pending_cursor: string | null;
  pending_started: string | null;
}

export async function getRegistrySyncState(): Promise<RegistrySyncState> {
  const database = await getDatabase();
  const rows = await database.select<RegistrySyncState[]>(
    "SELECT * FROM registry_sync WHERE id = 1",
  );
  return rows[0];
}

export async function setRegistrySyncProgress(
  since: string | null,
  cursor: string | null,
  started: string | null,
): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    "UPDATE registry_sync SET pending_since = $1, pending_cursor = $2, pending_started = $3 WHERE id = 1",
    [since, cursor, started],
  );
}

export async function completeRegistrySync(checkpoint: string, lastSuccess: number): Promise<void> {
  const database = await getDatabase();
  await database.execute(
    `UPDATE registry_sync SET initial_complete = 1, checkpoint = $1, last_success = $2,
     pending_since = NULL, pending_cursor = NULL, pending_started = NULL WHERE id = 1`,
    [checkpoint, lastSuccess],
  );
}

export async function getRegistryCount(): Promise<number> {
  const database = await getDatabase();
  const rows = await database.select<{ count: number }[]>(
    "SELECT COUNT(*) AS count FROM registry_entries WHERE is_latest = 1 AND status != 'deleted'",
  );
  return rows[0].count;
}

export async function importRegistryPage(entries: MCPRegistryEntry[]): Promise<void> {
  if (!entries.length) return;
  const values = entries.map((entry) => {
    const summary = createMcpRegistrySummary(entry);
    const meta = entry._meta["io.modelcontextprotocol.registry/official"];
    return {
      name: entry.server.name,
      version: entry.server.version,
      latest: Number(meta.isLatest),
      status: meta.status,
      updated: meta.updatedAt,
      title: summary.displayName,
      description: summary.description,
      keywords: [
        summary.publisher,
        summary.license,
        ...summary.categories,
        ...summary.tags,
        ...summary.keywords,
        ...summary.transportTypes,
        summary.installType,
      ]
        .filter(Boolean)
        .join(" "),
      stdio: Number(
        summary.transportTypes.includes("stdio") ||
          !summary.transportTypes.includes("streamable-http"),
      ),
      http: Number(summary.transportTypes.includes("streamable-http")),
      summary: JSON.stringify(summary),
      entry: JSON.stringify(entry),
    };
  });
  const database = await getDatabase();
  await database.execute(
    `INSERT INTO registry_entries
     (name, version, is_latest, status, updated_at, title, description, keywords,
      has_stdio, has_http, summary_json, entry_json)
     SELECT value ->> '$.name', value ->> '$.version', value ->> '$.latest',
       value ->> '$.status', value ->> '$.updated', value ->> '$.title',
       value ->> '$.description', value ->> '$.keywords', value ->> '$.stdio',
       value ->> '$.http', value ->> '$.summary', value ->> '$.entry'
     FROM json_each($1) WHERE true
     ON CONFLICT(name, version) DO UPDATE SET
       is_latest = excluded.is_latest, status = excluded.status, updated_at = excluded.updated_at,
       title = excluded.title, description = excluded.description, keywords = excluded.keywords,
       has_stdio = excluded.has_stdio, has_http = excluded.has_http,
       summary_json = excluded.summary_json, entry_json = excluded.entry_json
     WHERE julianday(excluded.updated_at) >= julianday(registry_entries.updated_at)`,
    [JSON.stringify(values)],
  );
}

export interface RegistrySearchOptions {
  query: string;
  showDeviceExtensions: boolean;
  showOnlineExtensions: boolean;
}

export const EXTENSION_LIST_LIMIT = 100;

export async function searchRegistry(
  options: RegistrySearchOptions,
): Promise<{ extensions: McpRegistrySummary[]; hasMore: boolean }> {
  const database = await getDatabase();
  const terms = options.query.match(/[\p{L}\p{N}_]+/gu) ?? [];
  const match = terms.map((term) => `"${term}"*`).join(" AND ");
  if (options.query.trim() && !match) return { extensions: [], hasMore: false };
  const rows = await database.select<{ summary_json: string; has_more: number }[]>(
    `WITH matches AS MATERIALIZED (
     SELECT e.summary_json, e.title, e.name,
       ${match ? "bm25(registry_fts, 8, 10, 1, 2)" : "0"} AS relevance
     FROM registry_entries e
     ${match ? "JOIN registry_fts ON registry_fts.rowid = e.id" : ""}
     WHERE e.is_latest = 1 AND e.status != 'deleted'
       AND (($1 = 1 AND e.has_stdio = 1) OR ($2 = 1 AND e.has_http = 1))
       ${match ? "AND registry_fts MATCH $3" : ""}
     ORDER BY relevance, e.title COLLATE NOCASE, e.name
     LIMIT ${EXTENSION_LIST_LIMIT + 1}
     )
     SELECT summary_json, (SELECT COUNT(*) FROM matches) > ${EXTENSION_LIST_LIMIT} AS has_more
     FROM matches
     ORDER BY relevance, title COLLATE NOCASE, name
     LIMIT ${EXTENSION_LIST_LIMIT}`,
    [
      Number(options.showDeviceExtensions),
      Number(options.showOnlineExtensions),
      ...(match ? [match] : []),
    ],
  );
  return {
    extensions: rows.map((row) => JSON.parse(row.summary_json) as McpRegistrySummary),
    hasMore: Boolean(rows[0]?.has_more),
  };
}

export async function getRegistryExtension(name: string, version?: string) {
  const database = await getDatabase();
  const rows = await database.select<{ entry_json: string }[]>(
    `SELECT entry_json FROM registry_entries WHERE name = $1
     AND ${version ? "version = $2" : "is_latest = 1"} AND status != 'deleted' LIMIT 1`,
    version ? [name, version] : [name],
  );
  return rows.length
    ? createMcpRegistryExtension(mcpRegistryEntrySchema.parse(JSON.parse(rows[0].entry_json)))
    : null;
}

export async function getRegistrySummaries(names: string[]): Promise<McpRegistrySummary[]> {
  if (!names.length) return [];
  const database = await getDatabase();
  const rows = await database.select<{ summary_json: string }[]>(
    `SELECT summary_json FROM registry_entries WHERE is_latest = 1 AND status != 'deleted'
     AND name IN (SELECT value FROM json_each($1))`,
    [JSON.stringify(names)],
  );
  return rows.map((row) => {
    const summary = JSON.parse(row.summary_json) as McpRegistrySummary;
    return { ...summary, searchText: createSearchText(summary) };
  });
}
