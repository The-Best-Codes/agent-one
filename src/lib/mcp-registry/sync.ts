import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { atom, getDefaultStore } from "jotai";

import { MODEL_DIRECTORY_SYNC_INTERVAL_MS } from "@/lib/ai/models/model-directory";
import { lastExtensionListSyncTimestampAtom } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";

import {
  completeRegistrySync,
  getRegistryCount,
  getRegistrySyncState,
  importRegistryPage,
  setRegistrySyncProgress,
} from "./storage";
import { mcpRegistryPageSchema } from "./types";

const SOURCE_URL = "https://registry.modelcontextprotocol.io/v0.1/servers";
const CHECKPOINT_OVERLAP_MS = 5 * 60 * 1000;
const logger = getLogger(import.meta.url);
const store = getDefaultStore();

const extensionListSyncStatusAtom = atom({
  isStartupComplete: false,
  hasDownloadedList: false,
  isUpdating: false,
  entryCount: 0,
  processedCount: 0,
  totalCount: null as number | null,
  error: "",
});
export const extensionListStatusAtom = atom((get) => ({
  ...get(extensionListSyncStatusAtom),
  fetchedAt: get(lastExtensionListSyncTimestampAtom),
}));
export const extensionListRevisionAtom = atom(0);

let loadPromise: Promise<void> | null = null;
let updatePromise: Promise<{ ok: boolean; error?: string; entryCount?: number }> | null = null;
let startupPromise: Promise<void> | null = null;

export function loadPersistedExtensionList(): Promise<void> {
  loadPromise ??= (async () => {
    const [state, count] = await Promise.all([getRegistrySyncState(), getRegistryCount()]);
    store.set(extensionListSyncStatusAtom, (status) => ({
      ...status,
      hasDownloadedList: Boolean(state.initial_complete),
      entryCount: count,
    }));
  })().catch((error) => {
    loadPromise = null;
    throw error;
  });
  return loadPromise;
}

async function refreshExtensionList(): Promise<{
  ok: boolean;
  error?: string;
  entryCount?: number;
}> {
  store.set(extensionListSyncStatusAtom, (status) => ({
    ...status,
    isUpdating: true,
    processedCount: 0,
    totalCount: null,
    error: "",
  }));
  try {
    await loadPersistedExtensionList();
    const state = await getRegistrySyncState();
    let cursor = state.pending_cursor;
    let since = state.pending_started
      ? state.pending_since
      : state.initial_complete
        ? state.checkpoint
        : null;
    let started = state.pending_started;
    let processedCount = 0;
    let lastPublished = 0;
    let hasRestarted = false;
    const seenCursors = new Set<string>();

    while (true) {
      const url = new URL(SOURCE_URL);
      url.searchParams.set("limit", "100");
      url.searchParams.set("include_deleted", "true");
      if (since) url.searchParams.set("updated_since", since);
      else url.searchParams.set("version", "latest");
      if (cursor) {
        if (seenCursors.has(cursor)) throw new Error("Extension list returned a repeated page");
        seenCursors.add(cursor);
        url.searchParams.set("cursor", cursor);
      }
      const requestStarted = Date.now();
      const response = await tauriFetch(url.toString(), {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(60_000),
      });
      if (!response.ok) {
        if (cursor && response.status === 400) {
          await setRegistrySyncProgress(null, null, null);
          if (!hasRestarted) {
            hasRestarted = true;
            cursor = null;
            since = state.initial_complete ? state.checkpoint : null;
            started = null;
            processedCount = 0;
            seenCursors.clear();
            store.set(extensionListSyncStatusAtom, (status) => ({ ...status, processedCount: 0 }));
            continue;
          }
        }
        throw new Error(`Request failed with status ${response.status}`);
      }
      const page = mcpRegistryPageSchema.parse(await response.json());
      if (!page.metadata.nextCursor) {
        store.set(extensionListSyncStatusAtom, (status) => ({
          ...status,
          totalCount: processedCount + page.servers.length,
        }));
      }
      if (!started) {
        const serverTime = Date.parse(response.headers.get("date") ?? "");
        started = new Date(
          (Number.isFinite(serverTime) ? serverTime : requestStarted) - CHECKPOINT_OVERLAP_MS,
        ).toISOString();
        await setRegistrySyncProgress(since, cursor, started);
      }
      await importRegistryPage(page.servers);
      processedCount += page.servers.length;
      store.set(extensionListSyncStatusAtom, (status) => ({ ...status, processedCount }));
      if (Date.now() - lastPublished >= 1000) {
        store.set(extensionListRevisionAtom, (revision) => revision + 1);
        lastPublished = Date.now();
      }
      cursor = page.metadata.nextCursor || null;
      if (!cursor) break;
      await setRegistrySyncProgress(since, cursor, started);
    }

    const fetchedAt = Date.now();
    const entryCount = await getRegistryCount();
    await completeRegistrySync(started);
    store.set(lastExtensionListSyncTimestampAtom, fetchedAt);
    store.set(extensionListSyncStatusAtom, (status) => ({
      ...status,
      hasDownloadedList: true,
      entryCount,
    }));
    store.set(extensionListRevisionAtom, (revision) => revision + 1);
    return { ok: true, entryCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update extension list";
    store.set(extensionListSyncStatusAtom, (status) => ({ ...status, error: message }));
    logger.warn("Failed to update extension list", error);
    return { ok: false, error: message };
  } finally {
    store.set(extensionListSyncStatusAtom, (status) => ({ ...status, isUpdating: false }));
  }
}

export function updateExtensionList() {
  updatePromise ??= refreshExtensionList().finally(() => {
    updatePromise = null;
  });
  return updatePromise;
}

export function syncExtensionListOnStartup(): Promise<void> {
  startupPromise ??= (async () => {
    await loadPersistedExtensionList();
    const status = store.get(extensionListStatusAtom);
    if (
      !status.hasDownloadedList ||
      Date.now() - status.fetchedAt >= MODEL_DIRECTORY_SYNC_INTERVAL_MS
    ) {
      await updateExtensionList();
    }
  })()
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Failed to load extension list";
      store.set(extensionListSyncStatusAtom, (status) => ({ ...status, error: message }));
      logger.warn("Failed to load extension list", error);
    })
    .finally(() => {
      store.set(extensionListSyncStatusAtom, (status) => ({ ...status, isStartupComplete: true }));
    });
  return startupPromise;
}
