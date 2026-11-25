import { invoke } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { generateId, type UIMessage } from "ai";
import { getDefaultStore } from "jotai";
import debounce from "lodash.debounce";

import type { ChatMetadata } from "@/contexts/use-persistence/persistence-context";
import { getAuthToken, SERVER_URL, USER_AGENT } from "@/lib/auth/auth-client";
import { chatStatusIndicatorsAtom } from "@/lib/jotai/atoms";
import {
  type ChatSyncPhase,
  chatSyncAvailableAtom,
  chatSyncDownloadingIdsAtom,
  chatSyncEnabledAtom,
  chatSyncExcludedIdsAtom,
  chatSyncStatusAtom,
  defaultDeviceNameAtom,
  deviceNameAtom,
} from "@/lib/jotai/sync-atoms";
import { skipPlanChecksAtom } from "@/lib/jotai/unsynced-local-atoms";
import { getLogger } from "@/lib/logger";
import {
  chatStorage,
  deleteChatRows,
  enqueueWrite,
  extractTextFromMessages,
  getDb,
  onLocalChatChange,
  replaceFtsEntry,
  upsertChatMessages,
  upsertChatMetadata,
} from "@/lib/storage/chat-storage";

const logger = getLogger(import.meta.url);

const STATE_LS_KEY = "agent-one-chat-sync-state";
const DEVICE_ID_LS_KEY = "agent-one-device-id";
const DEVICES_LS_KEY = "agent-one-chat-sync-devices";
const CHAT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const BODY_VERSION = 1;
const MAX_DEVICE_NAME_LENGTH = 64;
const LOCAL_CHANGE_DEBOUNCE_MS = 5_000;
const LOCAL_CHANGE_MAX_WAIT_MS = 30_000;
const PULL_INTERVAL_VISIBLE_MS = 5 * 60_000;
const PULL_INTERVAL_HIDDEN_MS = 30 * 60_000;
const MIN_FOCUS_PULL_GAP_MS = 60_000;
const MIN_OPEN_PULL_GAP_MS = 20_000;
const QUOTA_RETRY_MS = 60 * 60_000;
const INITIAL_RETRY_MS = 5_000;
const MAX_RETRY_MS = 10 * 60_000;
const BATCH_SIZE = 100;
const BATCH_PAUSE_MS = 15_000;
const DOWNLOAD_CONCURRENCY = 2;
const UPLOAD_BATCH_MAX_CHATS = 25;
const UPLOAD_BATCH_MAX_BYTES = 8 * 1024 * 1024;
const MAX_FUTURE_SKEW_MS = 60_000;
const REQUEST_TIMEOUT_MS = 10 * 60_000;

type PassKind = "push" | "full";

type UploadOutcome = "ok" | "conflict" | "quota" | "skipped" | "failed";

type UploadResult =
  | { status: "ok"; rev: number }
  | { status: "conflict"; rev: number; deleted: boolean }
  | { status: "chat_too_large" }
  | { status: "quota_exceeded" }
  | { status: "invalid" | "error"; error?: string };

type BatchUploadResult = UploadResult & { id: string };

interface SyncRow {
  chat_id: string;
  rev: number;
  remote_rev: number;
  remote_deleted: number;
  remote_disabled: number;
  local_version: number;
  synced_version: number;
  local_deleted: number;
  excluded: number;
  skipped_version: number;
  remote_updated_at: number;
  first_device_id: string | null;
  first_device_name: string | null;
  last_device_id: string | null;
  last_device_name: string | null;
  last_synced_at: number;
  updated_at: number;
  project_id?: string | null;
}

interface RemoteChat {
  id: string;
  metadata: Record<string, unknown>;
  updatedAt: number;
  size: number;
  deleted: boolean;
  rev: number;
}

interface PullResponse {
  chats: RemoteChat[];
  rev: number;
  hasMore: boolean;
  limits?: { maxChatBytes: number; maxTotalBytes: number };
}

interface ChatBody {
  v: number;
  metadata: ChatMetadata;
  messages: UIMessage[];
}

interface StoredState {
  userId: string;
  cursor: number;
  lastSyncedAt?: number;
}

interface DeviceRef {
  id: string;
  name: string;
}

interface PreparedUpload {
  row: SyncRow;
  blob: Blob;
  disabled: boolean;
  first: DeviceRef;
  self: DeviceRef;
  syncedAt: number;
  meta: { baseRev: number; updatedAt: number; metadata: Record<string, unknown> };
}

type DeviceRegistry = Record<string, { name: string; seenAt: number }>;

export interface ChatSyncDevice extends DeviceRef {
  isThisDevice: boolean;
}

export type ChatSyncState =
  | "synced"
  | "pending"
  | "downloading"
  | "excluded"
  | "project"
  | "too-large";

export interface ChatSyncInfo {
  state: ChatSyncState;
  firstDevice: ChatSyncDevice | null;
  lastDevice: ChatSyncDevice | null;
  lastSyncedAt: number | null;
}

export interface RemoteChatChanges {
  updated: string[];
  deleted: string[];
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: Record<string, unknown>,
  ) {
    super(message);
  }
}

class SyncStoppedError extends Error {}

class NetworkError extends Error {}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

function userMessage(error: unknown): string {
  if (error instanceof NetworkError) return "Couldn't reach the sync server.";
  if (!(error instanceof HttpError)) return "Something went wrong while syncing chats.";
  if (error.status === 402) return "Chat sync requires a Pro plan or higher.";
  if (error.status >= 500) return "The sync server ran into a problem.";
  return "The sync server rejected the request.";
}

function describeError(error: unknown): string {
  if (error instanceof HttpError) return `HTTP ${error.status}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    logger.warn(`Failed to save ${key} to localStorage`);
  }
}

function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_LS_KEY);
    if (existing) return existing;
    const created = generateId();
    localStorage.setItem(DEVICE_ID_LS_KEY, created);
    return created;
  } catch {
    return "unknown";
  }
}

function parseDevice(value: unknown): DeviceRef | null {
  if (typeof value !== "object" || value === null) return null;
  const device = value as Partial<DeviceRef>;
  if (typeof device.id !== "string" || typeof device.name !== "string") return null;
  return { id: device.id.slice(0, 64), name: device.name.slice(0, MAX_DEVICE_NAME_LENGTH) };
}

async function gzip(text: string): Promise<Blob> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).blob();
}

async function gunzip(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return new TextDecoder().decode(bytes);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

function isChatBody(value: unknown): value is ChatBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Partial<ChatBody>;
  return (
    typeof body.metadata === "object" &&
    body.metadata !== null &&
    typeof body.metadata.title === "string" &&
    Array.isArray(body.messages)
  );
}

function summaryMetadata(metadata: ChatMetadata): Record<string, unknown> {
  return {
    v: BODY_VERSION,
    title: metadata.title.slice(0, 500),
    projectId: metadata.projectId,
    branchOf: metadata.branchOf,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    lastMessageAt: metadata.lastMessageAt,
  };
}

async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  let failed = false;
  const next = async (): Promise<void> => {
    while (index < items.length && !failed) {
      const item = items[index++];
      try {
        await worker(item);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  const results = await Promise.allSettled(
    Array.from({ length: Math.min(limit, items.length) }, next),
  );
  const rejected = results.find((result) => result.status === "rejected");
  if (rejected) throw rejected.reason;
}

class ChatSyncManager {
  private userId: string | null = null;
  private paid: boolean | null = null;
  private running = false;
  private pendingKind: PassKind | null = null;
  private retryMs = INITIAL_RETRY_MS;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private pollTimeout: ReturnType<typeof setTimeout> | null = null;
  private backlogTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastFullAt = 0;
  private lastPullAt = 0;
  private quotaFullUntil = 0;
  private lastError: string | null = null;
  private stoppedForUser: string | null = null;
  private maxChatBytes = 16 * 1024 * 1024;
  private pullPromise: Promise<void> | null = null;
  private chatBackoff = new Map<string, { delay: number; until: number; reason: string }>();
  private downloads = new Map<string, Promise<"applied" | "kept" | "skipped">>();
  private listeners = new Set<(changes: RemoteChatChanges) => void>();

  private debouncedPush = debounce(() => this.schedule("push"), LOCAL_CHANGE_DEBOUNCE_MS, {
    maxWait: LOCAL_CHANGE_MAX_WAIT_MS,
  });

  private refreshStatus = debounce(() => void this.computeStatus(), 250, { maxWait: 1_000 });

  constructor() {
    onLocalChatChange(() => {
      if (!this.isActive()) return;
      this.debouncedPush();
      this.refreshStatus();
    });

    const store = getDefaultStore();
    store.sub(chatSyncEnabledAtom, () => this.refresh());
    store.sub(skipPlanChecksAtom, () => {
      this.stoppedForUser = null;
      this.refresh();
    });

    if (typeof window !== "undefined") {
      const onAttention = () => {
        if (document.visibilityState !== "visible") return;
        if (Date.now() - this.lastFullAt >= MIN_FOCUS_PULL_GAP_MS) this.schedule("full");
        else this.schedulePoll();
      };
      window.addEventListener("focus", onAttention);
      document.addEventListener("visibilitychange", onAttention);
      window.addEventListener("online", () => this.schedule("full", true));
    }

    invoke<string>("device_display_name")
      .then((name) => {
        if (name.trim()) store.set(defaultDeviceNameAtom, name.trim());
      })
      .catch((error) => logger.warn("Failed to read the device name:", error));

    void this.loadExcluded();
  }

  setAccount(account: { userId: string; paid: boolean | null } | null): void {
    const userId = account?.userId ?? null;
    const paid = account?.paid ?? null;
    if (userId === this.userId && paid === this.paid) return;
    if (userId !== this.userId) this.chatBackoff.clear();
    this.userId = userId;
    this.paid = paid;
    this.stoppedForUser = null;
    this.refresh();
  }

  onRemoteChange(listener: (changes: RemoteChatChanges) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  syncNow(): void {
    this.schedule("full");
  }

  async setChatExcluded(chatId: string, excluded: boolean): Promise<void> {
    await enqueueWrite((d) =>
      d.execute(
        `INSERT INTO chat_sync (chat_id, excluded, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT(chat_id) DO UPDATE SET
           excluded = $2,
           local_version = chat_sync.local_version + 1,
           updated_at = $3`,
        [chatId, excluded ? 1 : 0, Date.now()],
      ),
    );
    this.chatBackoff.delete(chatId);
    await this.loadExcluded();
    this.refreshStatus();
    this.schedule("push");
  }

  async syncChatOnOpen(chatId: string): Promise<void> {
    const userId = this.userId;
    if (!userId || !this.isActive() || !CHAT_ID_PATTERN.test(chatId)) return;
    try {
      if (!this.retryTimeout && Date.now() - this.lastPullAt >= MIN_OPEN_PULL_GAP_MS) {
        await this.pull(userId);
      }
      const row = await this.getRow(chatId);
      if (row && row.remote_rev > row.rev) {
        this.chatBackoff.delete(chatId);
        await this.applyRows([row]);
      }
    } catch (error) {
      if (error instanceof SyncStoppedError) return;
      logger.warn(`Failed to sync chat ${chatId} on open: ${describeError(error)}`);
    } finally {
      this.refreshStatus();
    }
  }

  async getChatSyncInfo(chatId: string): Promise<ChatSyncInfo> {
    const row = await this.getRow(chatId);
    const self = this.device();
    const registry = readJson<DeviceRegistry>(DEVICES_LS_KEY) ?? {};
    const resolve = (id: string | null, name: string | null): ChatSyncDevice | null => {
      if (!id) return null;
      if (id === self.id) return { ...self, isThisDevice: true };
      return { id, name: registry[id]?.name ?? name ?? "Another device", isThisDevice: false };
    };

    let state: ChatSyncState = "synced";
    if (getDefaultStore().get(chatSyncDownloadingIdsAtom).has(chatId)) state = "downloading";
    else if (row?.project_id) state = "project";
    else if (row?.excluded) state = "excluded";
    else if (
      row &&
      row.local_version === row.skipped_version &&
      row.local_version !== row.synced_version
    ) {
      state = "too-large";
    } else if (!row || row.local_version !== row.synced_version || row.remote_rev > row.rev) {
      state = "pending";
    }

    return {
      state,
      firstDevice: resolve(row?.first_device_id ?? null, row?.first_device_name ?? null),
      lastDevice: resolve(row?.last_device_id ?? null, row?.last_device_name ?? null),
      lastSyncedAt: row?.last_synced_at || null,
    };
  }

  private device(): DeviceRef {
    const store = getDefaultStore();
    const name = store.get(deviceNameAtom).trim() || store.get(defaultDeviceNameAtom);
    return { id: getDeviceId(), name: name.slice(0, MAX_DEVICE_NAME_LENGTH) };
  }

  private isEligible(): boolean {
    if (!this.userId || this.stoppedForUser === this.userId) return false;
    return this.paid === true || getDefaultStore().get(skipPlanChecksAtom);
  }

  private isActive(): boolean {
    return (
      getDefaultStore().get(chatSyncEnabledAtom) && Boolean(getAuthToken()) && this.isEligible()
    );
  }

  private refresh(): void {
    const active = this.isActive();
    getDefaultStore().set(chatSyncAvailableAtom, active);
    if (active) {
      this.schedule("full", true);
    } else {
      this.debouncedPush.cancel();
      this.clearRetry();
      this.clearPoll();
      this.clearBacklog();
    }
    this.refreshStatus();
  }

  private schedule(kind: PassKind, force = false): void {
    if (!this.isActive()) return;
    if (this.retryTimeout && !force) return;
    if (kind === "full") this.debouncedPush.cancel();
    if (this.running) {
      if (this.pendingKind !== "full") this.pendingKind = kind;
      return;
    }
    void this.run(kind);
  }

  private async run(kind: PassKind): Promise<void> {
    this.running = true;
    this.clearPoll();
    this.clearBacklog();
    this.refreshStatus();
    try {
      await this.runPass(kind);
    } finally {
      this.running = false;
      const pending = this.pendingKind;
      this.pendingKind = null;
      if (pending && this.isActive() && !this.backlogTimeout) void this.run(pending);
      else this.schedulePoll();
      this.refreshStatus();
    }
  }

  private clearPoll(): void {
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
  }

  private schedulePoll(): void {
    this.clearPoll();
    if (!this.isActive()) return;
    const interval =
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? PULL_INTERVAL_VISIBLE_MS
        : PULL_INTERVAL_HIDDEN_MS;
    const delay = Math.max(0, this.lastFullAt + interval - Date.now());
    this.pollTimeout = setTimeout(() => {
      this.pollTimeout = null;
      this.schedule("full");
    }, delay);
  }

  private clearBacklog(): void {
    if (this.backlogTimeout) {
      clearTimeout(this.backlogTimeout);
      this.backlogTimeout = null;
    }
  }

  private scheduleBacklog(): void {
    if (this.backlogTimeout) return;
    logger.verbose(`More chats waiting to sync, continuing in ${BATCH_PAUSE_MS}ms`);
    this.backlogTimeout = setTimeout(() => {
      this.backlogTimeout = null;
      this.schedule("full");
    }, BATCH_PAUSE_MS);
  }

  private clearRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.retryMs = INITIAL_RETRY_MS;
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) return;
    const delay = this.retryMs;
    this.retryMs = Math.min(this.retryMs * 2, MAX_RETRY_MS);
    logger.verbose(`Scheduling chat sync retry in ${delay}ms`);
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.schedule("full");
    }, delay);
  }

  private async runPass(kind: PassKind): Promise<void> {
    try {
      const userId = this.userId;
      if (!userId) return;
      await this.ensureAccountState(userId);
      let more = false;
      if (kind === "full") {
        await this.trackUntrackedChats();
        await this.pull(userId);
        more = await this.applyRemoteChanges();
        this.lastFullAt = Date.now();
      }
      const pushed = await this.push();
      more ||= pushed.more;
      if (pushed.conflicted) {
        await this.pull(userId);
        more = (await this.applyRemoteChanges()) || more;
        more = (await this.push()).more || more;
      }
      this.lastError = null;
      if (this.retryTimeout === null) this.retryMs = INITIAL_RETRY_MS;
      this.saveLastSynced(userId);
      if (more) this.scheduleBacklog();
    } catch (error) {
      if (error instanceof SyncStoppedError) return;
      if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
        logger.warn("Chat sync was rejected by the server, pausing until the account changes");
        this.stoppedForUser = this.userId;
        this.refresh();
        return;
      }
      this.lastError = userMessage(error);
      logger.warn(`Chat sync failed: ${describeError(error)}`);
      this.scheduleRetry();
    }
  }

  private saveLastSynced(userId: string): void {
    const state = readJson<StoredState>(STATE_LS_KEY);
    if (state?.userId !== userId) return;
    writeJson(STATE_LS_KEY, { ...state, lastSyncedAt: Date.now() });
  }

  private async computeStatus(): Promise<void> {
    const store = getDefaultStore();
    const previous = store.get(chatSyncStatusAtom);
    if (!this.isActive()) {
      store.set(chatSyncStatusAtom, { ...previous, phase: "off", error: null });
      return;
    }
    try {
      const d = await getDb();
      const [counts] = await d.select<
        {
          uploads: number | null;
          downloads: number | null;
          too_large: number | null;
          total: number | null;
          synced: number | null;
        }[]
      >(
        `SELECT
           SUM(CASE WHEN local_version != synced_version AND local_version != skipped_version
                     AND local_deleted = 0 AND excluded = 0 AND m.project_id IS NULL
                    THEN 1 ELSE 0 END) AS uploads,
           SUM(CASE WHEN remote_rev > rev AND local_deleted = 0 AND m.project_id IS NULL
                    THEN 1 ELSE 0 END) AS downloads,
           SUM(CASE WHEN local_version = skipped_version AND local_version != synced_version
                    THEN 1 ELSE 0 END) AS too_large,
           SUM(CASE WHEN excluded = 0 AND local_deleted = 0 AND m.project_id IS NULL
                    THEN 1 ELSE 0 END) AS total,
           SUM(CASE WHEN excluded = 0 AND local_deleted = 0 AND m.project_id IS NULL
                     AND local_version = synced_version AND remote_rev <= rev
                    THEN 1 ELSE 0 END) AS synced
         FROM chat_sync s LEFT JOIN chat_metadata m ON m.id = s.chat_id`,
        [],
      );
      const state = readJson<StoredState>(STATE_LS_KEY);
      const pendingUploads = counts?.uploads ?? 0;
      const pendingDownloads = counts?.downloads ?? 0;
      const failures = [...this.chatBackoff.values()];
      const error =
        this.lastError ??
        (failures.length > 0
          ? `${count(failures.length, "chat")} couldn't sync: ${failures.at(-1)?.reason}`
          : null);
      let phase: ChatSyncPhase = "idle";
      if (this.running) phase = "syncing";
      else if (error) phase = "error";
      else if (Date.now() < this.quotaFullUntil) phase = "quota";
      else if (pendingUploads + pendingDownloads > 0) phase = "waiting";
      store.set(chatSyncStatusAtom, {
        phase,
        pendingUploads,
        pendingDownloads,
        tooLarge: counts?.too_large ?? 0,
        totalChats: counts?.total ?? 0,
        syncedChats: counts?.synced ?? 0,
        lastSyncedAt: state?.userId === this.userId ? (state?.lastSyncedAt ?? null) : null,
        error,
      });
    } catch (error) {
      logger.warn("Failed to read chat sync status:", error);
    }
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const token = getAuthToken();
    if (!token || !this.isActive()) throw new SyncStoppedError();
    const response = await tauriFetch(`${SERVER_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: SERVER_URL,
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }).catch((error: unknown) => {
      throw new NetworkError(error instanceof Error ? error.message : String(error));
    });
    if (!response.ok) {
      const body = await response
        .json()
        .then((value: unknown) =>
          typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {},
        )
        .catch(() => ({}) as Record<string, unknown>);
      const message =
        typeof body.error === "string" ? body.error : `Server returned ${response.status}`;
      throw new HttpError(response.status, message, body);
    }
    return response;
  }

  private async ensureAccountState(userId: string): Promise<StoredState> {
    const state = readJson<StoredState>(STATE_LS_KEY);
    if (state?.userId === userId) return state;

    if (state) {
      logger.info("Chat sync account changed, re-uploading local chats to the new account");
      await enqueueWrite(async (d) => {
        await d.execute(
          `DELETE FROM chat_sync
           WHERE local_deleted = 1 OR chat_id NOT IN (SELECT id FROM chat_metadata)`,
          [],
        );
        await d.execute(
          `UPDATE chat_sync SET
             rev = 0,
             remote_rev = 0,
             remote_deleted = 0,
             remote_disabled = 0,
             remote_updated_at = 0,
             synced_version = 0,
             skipped_version = 0,
             first_device_id = NULL,
             first_device_name = NULL,
             last_device_id = NULL,
             last_device_name = NULL,
             last_synced_at = 0,
             local_version = MAX(local_version, 1)`,
          [],
        );
      });
    }
    const fresh = { userId, cursor: 0 };
    writeJson(STATE_LS_KEY, fresh);
    return fresh;
  }

  private async trackUntrackedChats(): Promise<void> {
    await enqueueWrite((d) =>
      d.execute(
        `INSERT INTO chat_sync (chat_id, updated_at)
         SELECT id, COALESCE(updated_at, created_at, 0) FROM chat_metadata
         WHERE id NOT IN (SELECT chat_id FROM chat_sync)`,
        [],
      ),
    );
  }

  private async loadExcluded(): Promise<void> {
    try {
      const d = await getDb();
      const rows = await d.select<{ chat_id: string }[]>(
        "SELECT chat_id FROM chat_sync WHERE excluded = 1",
        [],
      );
      getDefaultStore().set(chatSyncExcludedIdsAtom, new Set(rows.map((row) => row.chat_id)));
    } catch (error) {
      logger.warn("Failed to load chat sync preferences:", error);
    }
  }

  private isBusy(chatId: string): boolean {
    return getDefaultStore().get(chatStatusIndicatorsAtom)[chatId] === "loading";
  }

  private setDownloading(chatId: string, downloading: boolean): void {
    const store = getDefaultStore();
    const current = store.get(chatSyncDownloadingIdsAtom);
    if (current.has(chatId) === downloading) return;
    const next = new Set(current);
    if (downloading) next.add(chatId);
    else next.delete(chatId);
    store.set(chatSyncDownloadingIdsAtom, next);
  }

  private pull(userId: string): Promise<void> {
    if (!this.pullPromise) {
      this.pullPromise = this.pullPages(userId).finally(() => {
        this.pullPromise = null;
      });
    }
    return this.pullPromise;
  }

  private async pullPages(userId: string): Promise<void> {
    let hasMore = true;
    while (hasMore) {
      const state = await this.ensureAccountState(userId);
      const response = await this.request(`/api/sync/chats?since=${state.cursor}`, {
        method: "GET",
      });
      const page = (await response.json()) as PullResponse;
      if (this.userId !== userId) throw new SyncStoppedError();
      if (page.limits?.maxChatBytes) this.maxChatBytes = page.limits.maxChatBytes;

      const chats = page.chats.filter((chat) => CHAT_ID_PATTERN.test(chat.id));
      if (chats.length > 0) await this.recordRemote(chats);

      if (this.userId !== userId) throw new SyncStoppedError();
      writeJson(STATE_LS_KEY, { ...state, userId, cursor: page.rev });
      hasMore = page.hasMore;
    }
    this.lastPullAt = Date.now();
  }

  private rememberDevices(chats: RemoteChat[]): void {
    const registry = readJson<DeviceRegistry>(DEVICES_LS_KEY) ?? {};
    let changed = false;
    for (const chat of chats) {
      const device = parseDevice(chat.metadata?.lastDevice);
      const syncedAt =
        typeof chat.metadata?.syncedAt === "number" ? chat.metadata.syncedAt : chat.updatedAt;
      if (!device) continue;
      const known = registry[device.id];
      if (!known || known.seenAt < syncedAt) {
        registry[device.id] = { name: device.name, seenAt: syncedAt };
        changed = true;
      }
    }
    if (changed) writeJson(DEVICES_LS_KEY, registry);
  }

  private async recordRemote(chats: RemoteChat[]): Promise<void> {
    this.rememberDevices(chats);
    await enqueueWrite(async (d) => {
      const placeholders = chats.map((_, i) => `$${i + 1}`).join(", ");
      const ids = chats.map((chat) => chat.id);
      const existingRows = await d.select<{ chat_id: string; remote_rev: number }[]>(
        `SELECT chat_id, remote_rev FROM chat_sync WHERE chat_id IN (${placeholders})`,
        ids,
      );
      const localRows = await d.select<{ id: string }[]>(
        `SELECT id FROM chat_metadata WHERE id IN (${placeholders})`,
        ids,
      );
      const existing = new Map(existingRows.map((row) => [row.chat_id, row.remote_rev]));
      const local = new Set(localRows.map((row) => row.id));

      for (const chat of chats) {
        const deleted = chat.deleted ? 1 : 0;
        const disabled = chat.metadata?.syncDisabled === true ? 1 : 0;
        const first = parseDevice(chat.metadata?.firstDevice);
        const last = parseDevice(chat.metadata?.lastDevice);
        const syncedAt =
          typeof chat.metadata?.syncedAt === "number" ? chat.metadata.syncedAt : chat.updatedAt;
        const known = existing.get(chat.id);
        if (known === undefined) {
          if ((deleted || disabled) && !local.has(chat.id)) continue;
          await d.execute(
            `INSERT INTO chat_sync (
               chat_id, local_version, synced_version, remote_rev, remote_deleted,
               remote_disabled, remote_updated_at, first_device_id, first_device_name,
               last_device_id, last_device_name, last_synced_at
             )
             VALUES ($1, $2, 0, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              chat.id,
              local.has(chat.id) ? 1 : 0,
              chat.rev,
              deleted,
              disabled,
              chat.updatedAt,
              first?.id ?? null,
              first?.name ?? null,
              last?.id ?? null,
              last?.name ?? null,
              deleted ? 0 : syncedAt,
            ],
          );
        } else if (chat.rev >= known) {
          await d.execute(
            `UPDATE chat_sync SET
               remote_rev = $2,
               remote_deleted = $3,
               remote_disabled = $4,
               remote_updated_at = $5,
               first_device_id = COALESCE($6, first_device_id),
               first_device_name = COALESCE($7, first_device_name),
               last_device_id = COALESCE($8, last_device_id),
               last_device_name = COALESCE($9, last_device_name),
               last_synced_at = CASE WHEN $10 > 0 THEN $10 ELSE last_synced_at END
             WHERE chat_id = $1`,
            [
              chat.id,
              chat.rev,
              deleted,
              disabled,
              chat.updatedAt,
              first?.id ?? null,
              first?.name ?? null,
              last?.id ?? null,
              last?.name ?? null,
              deleted ? 0 : syncedAt,
            ],
          );
        }
      }
    });
  }

  private async getRow(chatId: string): Promise<SyncRow | null> {
    const d = await getDb();
    const rows = await d.select<SyncRow[]>(
      `SELECT s.*, m.project_id FROM chat_sync s LEFT JOIN chat_metadata m ON m.id = s.chat_id
       WHERE s.chat_id = $1`,
      [chatId],
    );
    return rows[0] ?? null;
  }

  private async updateRow(
    chatId: string,
    expectedVersion: number,
    assignments: string,
    params: unknown[],
  ): Promise<boolean> {
    return enqueueWrite(async (d) => {
      const result = await d.execute(
        `UPDATE chat_sync SET ${assignments} WHERE chat_id = $1 AND local_version = $2`,
        [chatId, expectedVersion, ...params],
      );
      return result.rowsAffected > 0;
    });
  }

  private async applyRemoteChanges(): Promise<boolean> {
    const d = await getDb();
    const rows = await d.select<SyncRow[]>(
      `SELECT s.*, m.project_id FROM chat_sync s LEFT JOIN chat_metadata m ON m.id = s.chat_id
       WHERE s.remote_rev > s.rev ORDER BY s.remote_updated_at DESC`,
      [],
    );
    return this.applyRows(rows);
  }

  private async applyRows(rows: SyncRow[]): Promise<boolean> {
    if (rows.length === 0) return false;

    const changes: RemoteChatChanges = { updated: [], deleted: [] };
    let excludedChanged = false;
    const downloads: SyncRow[] = [];

    for (const row of rows) {
      if (this.isBusy(row.chat_id)) continue;
      const dirty = row.local_version !== row.synced_version;
      const id = row.chat_id;

      if (row.local_deleted) {
        if (row.remote_deleted) {
          await enqueueWrite((db) =>
            db.execute("DELETE FROM chat_sync WHERE chat_id = $1 AND local_version = $2", [
              id,
              row.local_version,
            ]),
          );
        } else if (row.remote_updated_at > row.updated_at && !row.remote_disabled) {
          if (
            await this.updateRow(
              id,
              row.local_version,
              "local_deleted = 0, synced_version = local_version",
              [],
            )
          ) {
            downloads.push({ ...row, local_deleted: 0, synced_version: row.local_version });
          }
        } else {
          await this.updateRow(id, row.local_version, "rev = remote_rev", []);
        }
        continue;
      }

      if (row.project_id) {
        await this.updateRow(id, row.local_version, "rev = remote_rev", []);
        continue;
      }

      if (row.remote_deleted) {
        if (row.excluded || (dirty && row.updated_at > row.remote_updated_at)) {
          await this.updateRow(id, row.local_version, "rev = remote_rev", []);
        } else {
          const removed = await enqueueWrite(async (db) => {
            const result = await db.execute(
              "DELETE FROM chat_sync WHERE chat_id = $1 AND local_version = $2",
              [id, row.local_version],
            );
            if (result.rowsAffected === 0) return false;
            await deleteChatRows(db, [id]);
            return true;
          });
          if (removed) changes.deleted.push(id);
        }
        continue;
      }

      if (row.remote_disabled) {
        if (dirty && !row.excluded && row.updated_at > row.remote_updated_at) {
          await this.updateRow(id, row.local_version, "rev = remote_rev", []);
        } else if (
          await this.updateRow(
            id,
            row.local_version,
            "excluded = 1, rev = remote_rev, synced_version = local_version",
            [],
          )
        ) {
          excludedChanged = true;
        }
        continue;
      }

      if (row.excluded && dirty) {
        await this.updateRow(id, row.local_version, "rev = remote_rev", []);
        continue;
      }

      downloads.push(row);
    }

    const ready = downloads.filter((row) => !this.isBackedOff(row.chat_id));
    const batch = ready.slice(0, BATCH_SIZE);
    let unreachable = false;
    try {
      await runPool(batch, DOWNLOAD_CONCURRENCY, async (row) => {
        if (unreachable) return;
        let result: "applied" | "kept" | "skipped";
        try {
          result = await this.download(row);
        } catch (error) {
          if (error instanceof NetworkError) unreachable = true;
          else if (!(error instanceof HttpError) || [401, 402, 403].includes(error.status)) {
            throw error;
          }
          this.backOffChat(row.chat_id, userMessage(error));
          return;
        }
        this.chatBackoff.delete(row.chat_id);
        if (result === "applied") changes.updated.push(row.chat_id);
        if (result !== "skipped" && row.excluded) excludedChanged = true;
      });
    } finally {
      if (excludedChanged) await this.loadExcluded();
      if (changes.updated.length > 0 || changes.deleted.length > 0) {
        logger.verbose(
          `Applied ${changes.updated.length} updated and ${changes.deleted.length} deleted chats from sync`,
        );
        for (const listener of this.listeners) listener(changes);
      }
      this.refreshStatus();
    }
    return unreachable || ready.length > batch.length;
  }

  private download(row: SyncRow): Promise<"applied" | "kept" | "skipped"> {
    const existing = this.downloads.get(row.chat_id);
    if (existing) return existing;
    this.setDownloading(row.chat_id, true);
    const promise = this.downloadAndApply(row).finally(() => {
      this.downloads.delete(row.chat_id);
      this.setDownloading(row.chat_id, false);
    });
    this.downloads.set(row.chat_id, promise);
    return promise;
  }

  private async downloadAndApply(row: SyncRow): Promise<"applied" | "kept" | "skipped"> {
    const id = row.chat_id;
    let response: Response;
    try {
      response = await this.request(`/api/sync/chats/${id}`, { method: "GET" });
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) return "skipped";
      throw error;
    }
    const remoteRev = Number(response.headers.get("X-Chat-Rev") ?? row.remote_rev);
    let body: unknown;
    try {
      body = JSON.parse(await gunzip(await response.arrayBuffer()));
    } catch (error) {
      logger.warn(`Synced chat ${id} could not be read, skipping`, error);
      await this.updateRow(id, row.local_version, "rev = MAX(rev, $3)", [remoteRev]);
      return "skipped";
    }
    if (!isChatBody(body)) {
      logger.warn(`Synced chat ${id} has an unknown format, skipping`);
      await this.updateRow(id, row.local_version, "rev = MAX(rev, $3)", [remoteRev]);
      return "skipped";
    }

    const current = await this.getRow(id);
    if (!current || current.local_version !== row.local_version || this.isBusy(id)) {
      return "skipped";
    }
    const dirty = current.local_version !== current.synced_version || Boolean(current.excluded);

    if (dirty) {
      const localWins = await this.localWins(id, current, body);
      if (localWins) {
        await this.updateRow(
          id,
          current.local_version,
          current.excluded
            ? "rev = MAX(rev, $3), excluded = 0, local_version = local_version + 1"
            : "rev = MAX(rev, $3)",
          [remoteRev],
        );
        return "kept";
      }
    }

    const applied = await enqueueWrite(async (d) => {
      const rows = await d.select<{ local_version: number }[]>(
        "SELECT local_version FROM chat_sync WHERE chat_id = $1",
        [id],
      );
      if (rows[0]?.local_version !== current.local_version) return false;
      await upsertChatMetadata(d, id, body.metadata);
      await upsertChatMessages(d, id, body.messages);
      await replaceFtsEntry(d, id, body.metadata.title, extractTextFromMessages(body.messages));
      await d.execute(
        `UPDATE chat_sync SET
           rev = $2,
           remote_rev = MAX(remote_rev, $2),
           remote_deleted = 0,
           remote_disabled = 0,
           excluded = 0,
           synced_version = local_version
         WHERE chat_id = $1`,
        [id, remoteRev],
      );
      return true;
    });
    return applied ? "applied" : "skipped";
  }

  private async localWins(id: string, row: SyncRow, remote: ChatBody): Promise<boolean> {
    const local = await chatStorage.getChatMetadata(id);
    if (!local) return false;
    const localTime = local.updatedAt ?? row.updated_at;
    const remoteTime = remote.metadata.updatedAt ?? row.remote_updated_at;
    return localTime >= remoteTime;
  }

  private async push(): Promise<{ conflicted: boolean; more: boolean }> {
    const d = await getDb();
    const rows = await d.select<(SyncRow & { present: number })[]>(
      `SELECT s.*, m.project_id, (m.id IS NOT NULL) AS present
       FROM chat_sync s LEFT JOIN chat_metadata m ON m.id = s.chat_id
       WHERE s.local_version != s.synced_version
         AND s.local_version != s.skipped_version
         AND s.rev = s.remote_rev
       ORDER BY s.updated_at DESC`,
      [],
    );

    const waiting = await d.select<{ chat_id: string }[]>(
      "SELECT chat_id FROM chat_sync WHERE remote_rev > rev",
      [],
    );
    const pendingIds = new Set([...rows, ...waiting].map((row) => row.chat_id));
    for (const id of this.chatBackoff.keys()) {
      if (!pendingIds.has(id)) this.chatBackoff.delete(id);
    }

    let conflicted = false;
    let skippedForQuota = false;
    const quotaPaused = () => Date.now() < this.quotaFullUntil;
    let uploaded = 0;
    let index = 0;
    let batch: PreparedUpload[] = [];
    let batchBytes = 0;
    const record = (outcome: UploadOutcome) => {
      if (outcome === "conflict") conflicted = true;
    };
    const flush = async () => {
      if (batch.length === 0) return;
      const items = batch;
      batch = [];
      batchBytes = 0;
      for (const outcome of await this.uploadBatch(items)) record(outcome);
      this.refreshStatus();
    };

    for (; index < rows.length && uploaded < BATCH_SIZE; index++) {
      const row = rows[index];
      if (this.isBusy(row.chat_id) || this.isBackedOff(row.chat_id)) continue;
      if (!row.local_deleted && !row.excluded && !row.project_id && quotaPaused()) {
        skippedForQuota = true;
        continue;
      }
      const prepared = await this.preparePush(row);
      if (!prepared) continue;
      uploaded++;
      if ((prepared.disabled && quotaPaused()) || prepared.blob.size > UPLOAD_BATCH_MAX_BYTES) {
        record(await this.uploadOne(prepared));
        continue;
      }
      if (
        batch.length >= UPLOAD_BATCH_MAX_CHATS ||
        batchBytes + prepared.blob.size > UPLOAD_BATCH_MAX_BYTES
      ) {
        await flush();
        if (quotaPaused()) continue;
      }
      batch.push(prepared);
      batchBytes += prepared.blob.size;
    }
    if (!quotaPaused()) await flush();
    this.refreshStatus();
    return { conflicted, more: !quotaPaused() && (skippedForQuota || index < rows.length) };
  }

  private isBackedOff(chatId: string): boolean {
    const backoff = this.chatBackoff.get(chatId);
    return Boolean(backoff && backoff.until > Date.now());
  }

  private backOffChat(chatId: string, reason: string): void {
    const delay = Math.min((this.chatBackoff.get(chatId)?.delay ?? 15_000) * 2, MAX_RETRY_MS);
    this.chatBackoff.set(chatId, { delay, until: Date.now() + delay, reason });
    logger.warn(`Chat ${chatId} failed to sync (${reason}), retrying it in ${delay}ms`);
  }

  private async preparePush(row: SyncRow & { present: number }): Promise<PreparedUpload | null> {
    const id = row.chat_id;
    const version = row.local_version;
    const markSynced = async () => {
      this.chatBackoff.delete(id);
      await this.updateRow(id, version, "synced_version = $2", []);
      return null;
    };

    if (!CHAT_ID_PATTERN.test(id)) return markSynced();

    if (row.local_deleted) {
      if (row.rev > 0) {
        await this.request(`/api/sync/chats/${id}`, { method: "DELETE" });
        this.quotaFullUntil = 0;
      }
      await enqueueWrite((db) =>
        db.execute(
          "DELETE FROM chat_sync WHERE chat_id = $1 AND local_version = $2 AND local_deleted = 1",
          [id, version],
        ),
      );
      this.chatBackoff.delete(id);
      return null;
    }

    if (row.excluded || row.project_id) {
      if (row.rev === 0 || row.remote_disabled) return markSynced();
      const blob = await gzip(JSON.stringify({ v: BODY_VERSION, syncDisabled: true }));
      return this.withDevices(row, blob, { syncDisabled: true }, Date.now(), true);
    }

    if (!row.present) return markSynced();

    const [metadata, messages] = await Promise.all([
      chatStorage.getChatMetadata(id),
      chatStorage.getChatMessages(id),
    ]);
    if (!metadata) return markSynced();
    const body: ChatBody = { v: BODY_VERSION, metadata, messages: messages ?? [] };
    const blob = await gzip(JSON.stringify(body));
    if (blob.size > this.maxChatBytes) {
      logger.warn(`Chat ${id} is too large to sync (${blob.size} bytes compressed)`);
      await this.updateRow(id, version, "skipped_version = $2", []);
      return null;
    }
    const updatedAt = metadata.updatedAt ?? row.updated_at;
    return this.withDevices(row, blob, summaryMetadata(metadata), updatedAt, false);
  }

  private withDevices(
    row: SyncRow,
    blob: Blob,
    metadata: Record<string, unknown>,
    updatedAt: number,
    disabled: boolean,
  ): PreparedUpload {
    const self = this.device();
    const first: DeviceRef =
      row.first_device_id && row.first_device_name
        ? { id: row.first_device_id, name: row.first_device_name }
        : self;
    const syncedAt = Date.now();
    return {
      row,
      blob,
      disabled,
      first,
      self,
      syncedAt,
      meta: {
        baseRev: row.rev,
        updatedAt: Math.max(1, Math.min(updatedAt || syncedAt, syncedAt + MAX_FUTURE_SKEW_MS)),
        metadata: { ...metadata, firstDevice: first, lastDevice: self, syncedAt },
      },
    };
  }

  private async uploadOne(item: PreparedUpload): Promise<UploadOutcome> {
    const id = item.row.chat_id;
    const form = new FormData();
    form.append("meta", JSON.stringify(item.meta));
    form.append("body", item.blob, `${id}.json.gz`);
    try {
      const response = await this.request(`/api/sync/chats/${id}`, { method: "PUT", body: form });
      const { rev } = (await response.json()) as { rev: number };
      return this.applyUploadResult(item, { status: "ok", rev });
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      if (error.status === 409) {
        return this.applyUploadResult(item, {
          status: "conflict",
          rev: typeof error.body.rev === "number" ? error.body.rev : item.row.remote_rev,
          deleted: error.body.deleted === true,
        });
      }
      if (error.status === 413) {
        return this.applyUploadResult(item, {
          status: error.body.code === "quota_exceeded" ? "quota_exceeded" : "chat_too_large",
        });
      }
      if (error.status === 401 || error.status === 402 || error.status === 403) throw error;
      logger.warn(`Chat ${id} upload failed: ${describeError(error)}`);
      return this.applyUploadResult(item, { status: "error", error: userMessage(error) });
    }
  }

  private async uploadBatch(items: PreparedUpload[]): Promise<UploadOutcome[]> {
    const form = new FormData();
    form.append(
      "meta",
      JSON.stringify(items.map((item) => ({ id: item.row.chat_id, ...item.meta }))),
    );
    for (const item of items) {
      form.append(`body:${item.row.chat_id}`, item.blob, `${item.row.chat_id}.json.gz`);
    }
    const response = await this.request("/api/sync/chats/batch", { method: "POST", body: form });
    const { results } = (await response.json()) as { results: BatchUploadResult[] };
    const byId = new Map(results.map((result) => [result.id, result]));
    const outcomes: UploadOutcome[] = [];
    for (const item of items) {
      const result = byId.get(item.row.chat_id) ?? { status: "error", error: "missing result" };
      outcomes.push(await this.applyUploadResult(item, result));
    }
    logger.verbose(`Uploaded a batch of ${items.length} chats`);
    return outcomes;
  }

  private async applyUploadResult(
    item: PreparedUpload,
    result: UploadResult,
  ): Promise<UploadOutcome> {
    const id = item.row.chat_id;
    if (result.status !== "invalid" && result.status !== "error") this.chatBackoff.delete(id);
    switch (result.status) {
      case "ok": {
        const saved = await enqueueWrite(async (db) => {
          const update = await db.execute(
            `UPDATE chat_sync SET
               rev = $2,
               remote_rev = MAX(remote_rev, $2),
               remote_deleted = 0,
               remote_disabled = $3,
               remote_updated_at = $4,
               first_device_id = $6,
               first_device_name = $7,
               last_device_id = $8,
               last_device_name = $9,
               last_synced_at = $10,
               synced_version = CASE WHEN local_version = $5 THEN $5 ELSE synced_version END
             WHERE chat_id = $1`,
            [
              id,
              result.rev,
              item.disabled ? 1 : 0,
              item.meta.updatedAt,
              item.row.local_version,
              item.first.id,
              item.first.name,
              item.self.id,
              item.self.name,
              item.syncedAt,
            ],
          );
          return update.rowsAffected > 0;
        });
        if (!saved) await this.request(`/api/sync/chats/${id}`, { method: "DELETE" });
        if (item.disabled) this.quotaFullUntil = 0;
        return "ok";
      }
      case "conflict":
        await enqueueWrite((db) =>
          db.execute(
            `UPDATE chat_sync SET
               remote_rev = MAX(remote_rev, $2),
               remote_deleted = CASE WHEN $2 > remote_rev THEN $3 ELSE remote_deleted END
             WHERE chat_id = $1`,
            [id, result.rev, result.deleted ? 1 : 0],
          ),
        );
        return "conflict";
      case "quota_exceeded":
        logger.warn("Chat sync storage is full, pausing uploads");
        this.quotaFullUntil = Date.now() + QUOTA_RETRY_MS;
        return "quota";
      case "chat_too_large":
        logger.warn(`Chat ${id} is too large to sync`);
        await this.updateRow(id, item.row.local_version, "skipped_version = $2", []);
        return "skipped";
      default:
        if (result.status === "invalid") {
          logger.warn(`Chat ${id} was rejected by the sync server: ${result.error ?? "invalid"}`);
        }
        this.backOffChat(
          id,
          result.status === "invalid"
            ? "The sync server rejected the request."
            : (result.error ?? "The sync server ran into a problem."),
        );
        return "failed";
    }
  }
}

export const chatSyncManager = new ChatSyncManager();
