import { invoke } from "@tauri-apps/api/core";
import { getDefaultStore, type WritableAtom } from "jotai";
import { RESET } from "jotai/utils";
import debounce from "lodash.debounce";

import { authClient, getAuthToken, SERVER_URL } from "@/lib/auth/auth-client";
import { encryptedSyncEnabledAtom, encryptedSyncStatusAtom } from "@/lib/jotai/sync-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const STATE_LS_KEY = "agent-one-encrypted-sync-state";
const DEBOUNCE_MS = 2000;
const INITIAL_RETRY_MS = 2000;
const MAX_RETRY_MS = 600_000;
const PUSH_BATCH_SIZE = 200;

export interface EncryptedVault {
  vaultId: string;
  wrappedKeys: unknown[];
}

interface CreatedVault extends EncryptedVault {
  recoveryKey: string;
}

interface SealedItem {
  id: string;
  nonce: string;
  ciphertext: string;
}

interface ServerItem extends SealedItem {
  updatedAt: number;
  rev: number;
}

interface OpenedItem {
  id: string;
  name: string;
  value: unknown;
}

interface PullResponse {
  vaultId: string | null;
  items: ServerItem[];
  rev: number;
  hasMore: boolean;
}

interface SyncState {
  vaultId: string | null;
  rev: number;
  timestamps: Record<string, number>;
  synced: Record<string, number>;
}

export interface EncryptedSyncSource {
  prefix: string;
  readAll: () => Promise<Record<string, unknown>>;
  write: (key: string, value: unknown) => Promise<void>;
}

class VaultChangedError extends Error {}

class SyncStoppedError extends Error {}

function loadState(): SyncState {
  try {
    const raw = localStorage.getItem(STATE_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SyncState>;
      return {
        vaultId: parsed.vaultId ?? null,
        rev: parsed.rev ?? 0,
        timestamps: parsed.timestamps ?? {},
        synced: parsed.synced ?? {},
      };
    }
  } catch {
    logger.verbose("Encrypted sync state in localStorage was corrupt, starting fresh");
  }
  return { vaultId: null, rev: 0, timestamps: {}, synced: {} };
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong";
}

async function serverFetch<T>(
  path: string,
  options: { method: "GET" | "POST" | "PUT" | "DELETE"; body?: unknown },
): Promise<T> {
  const { data, error } = await authClient.$fetch<T>(`${SERVER_URL}${path}`, options);
  if (error) {
    const message =
      (error as { error?: string }).error ?? error.message ?? `Server returned ${error.status}`;
    if (error.status === 409) throw new VaultChangedError(message);
    throw new Error(message);
  }
  return data as T;
}

class EncryptedSyncManager {
  private state: SyncState = loadState();
  private sources = new Map<string, EncryptedSyncSource>();
  private applying = new Set<string>();
  private ready: Promise<void>;
  private queue: Promise<void> = Promise.resolve();
  private retryMs = INITIAL_RETRY_MS;
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  private debouncedSync = debounce(() => this.syncNow(), DEBOUNCE_MS);

  constructor() {
    this.ready = this.refreshStatus();
  }

  registerSource(source: EncryptedSyncSource): void {
    this.sources.set(source.prefix, source);
  }

  markDirty(name: string): void {
    if (this.applying.has(name)) return;

    this.state.timestamps[name] = Date.now();
    this.saveState();

    if (getDefaultStore().get(encryptedSyncStatusAtom) === "unlocked") {
      this.debouncedSync();
    }
  }

  async refreshStatus(): Promise<void> {
    const store = getDefaultStore();
    if (!store.get(encryptedSyncEnabledAtom)) {
      store.set(encryptedSyncStatusAtom, "off");
      return;
    }
    try {
      const vaultId = await invoke<string | null>("encrypted_sync_vault_id");
      store.set(encryptedSyncStatusAtom, vaultId ? "unlocked" : "locked");
    } catch (error) {
      logger.warn("Failed to read encrypted sync status:", error);
      store.set(encryptedSyncStatusAtom, "locked");
    }
  }

  async getServerVault(): Promise<EncryptedVault | null> {
    const body = await serverFetch<{ vault: EncryptedVault | null }>("/api/sync/vault", {
      method: "GET",
    });
    return body.vault;
  }

  async createVault(passphrase: string): Promise<string> {
    const created = await invoke<CreatedVault>("encrypted_sync_create_vault", { passphrase });
    try {
      await serverFetch("/api/sync/vault", {
        method: "POST",
        body: { vaultId: created.vaultId, wrappedKeys: created.wrappedKeys },
      });
    } catch (error) {
      await invoke("encrypted_sync_lock").catch(() => undefined);
      if (error instanceof VaultChangedError) {
        throw new Error("Encrypted sync was already set up on another device. Try again.", {
          cause: error,
        });
      }
      throw error;
    }
    this.onUnlocked(created.vaultId);
    return created.recoveryKey;
  }

  async unlock(vault: EncryptedVault, secret: string, useRecoveryKey: boolean): Promise<void> {
    try {
      await invoke("encrypted_sync_unlock", {
        vaultId: vault.vaultId,
        wrappedKeys: vault.wrappedKeys,
        secret,
        useRecoveryKey,
      });
    } catch (error) {
      throw new Error(errorMessage(error), { cause: error });
    }
    this.onUnlocked(vault.vaultId);
  }

  async resetVault(vaultId: string): Promise<void> {
    await serverFetch(`/api/sync/vault?vaultId=${encodeURIComponent(vaultId)}`, {
      method: "DELETE",
    }).catch((error) => {
      if (!(error instanceof VaultChangedError)) throw error;
    });
    await this.lockLocally();
  }

  async disable(): Promise<void> {
    getDefaultStore().set(encryptedSyncEnabledAtom, false);
    await this.lockLocally();
    getDefaultStore().set(encryptedSyncStatusAtom, "off");
  }

  onSignedOut(): void {
    void this.lockLocally();
  }

  syncNow(): void {
    if (!getDefaultStore().get(encryptedSyncEnabledAtom) || !getAuthToken()) return;
    this.debouncedSync.cancel();
    this.queue = this.queue.then(() => this.ready).then(() => this.runSync());
  }

  private onUnlocked(vaultId: string): void {
    if (this.state.vaultId !== vaultId) {
      this.state.vaultId = vaultId;
      this.state.rev = 0;
      this.state.synced = {};
      this.saveState();
    }
    const store = getDefaultStore();
    store.set(encryptedSyncEnabledAtom, true);
    store.set(encryptedSyncStatusAtom, "unlocked");
    this.syncNow();
  }

  private async lockLocally(): Promise<void> {
    this.debouncedSync.cancel();
    this.clearRetry();
    this.state.vaultId = null;
    this.state.rev = 0;
    this.state.synced = {};
    this.saveState();
    try {
      await invoke("encrypted_sync_lock");
    } catch (error) {
      logger.warn("Failed to lock encrypted sync:", error);
    }
    const store = getDefaultStore();
    store.set(encryptedSyncStatusAtom, store.get(encryptedSyncEnabledAtom) ? "locked" : "off");
  }

  private saveState(): void {
    try {
      localStorage.setItem(STATE_LS_KEY, JSON.stringify(this.state));
    } catch {
      logger.warn("Failed to save encrypted sync state to localStorage");
    }
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
    logger.verbose(`Scheduling encrypted sync retry in ${delay}ms`);
    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.syncNow();
    }, delay);
  }

  private async runSync(): Promise<void> {
    if (getDefaultStore().get(encryptedSyncStatusAtom) !== "unlocked" || !getAuthToken()) return;

    try {
      await this.pull();
      const timestamps = { ...this.state.timestamps };
      const localValues = await this.readLocalValues();
      this.stampUntrackedValues(localValues, timestamps);
      await this.push(localValues, timestamps);
      this.clearRetry();
    } catch (error) {
      if (error instanceof SyncStoppedError) return;
      if (error instanceof VaultChangedError) {
        logger.info("Encrypted sync vault changed on the server, locking");
        await this.lockLocally();
        return;
      }
      logger.warn("Encrypted sync failed:", error);
      if (getAuthToken()) this.scheduleRetry();
    }
  }

  private async pull(): Promise<void> {
    let hasMore = true;
    while (hasMore) {
      const page = await serverFetch<PullResponse>(`/api/sync/encrypted?since=${this.state.rev}`, {
        method: "GET",
      });
      if (!page.vaultId || page.vaultId !== this.state.vaultId) throw new VaultChangedError();

      const opened = await invoke<OpenedItem[]>("encrypted_sync_open", {
        items: page.items.map(({ id, nonce, ciphertext }) => ({ id, nonce, ciphertext })),
      });
      const updatedAtById = new Map(page.items.map((item) => [item.id, item.updatedAt]));
      const ensureActive = () => {
        if (this.state.vaultId !== page.vaultId) throw new SyncStoppedError();
      };

      for (const item of opened) {
        ensureActive();
        const serverTime = updatedAtById.get(item.id);
        if (serverTime === undefined) continue;
        await this.applyRemote(item.name, item.value, serverTime);
      }

      if (opened.length < page.items.length) {
        logger.warn(`Skipped ${page.items.length - opened.length} items that failed to decrypt`);
      }

      ensureActive();
      this.state.rev = page.rev;
      this.saveState();
      hasMore = page.hasMore;
    }
  }

  private async applyRemote(name: string, value: unknown, serverTime: number): Promise<void> {
    const localTime = this.state.timestamps[name];
    if (localTime !== undefined && localTime > serverTime) return;

    if (localTime !== serverTime) {
      const source = this.findSource(name);
      if (!source) return;

      this.applying.add(name);
      let write: Promise<void>;
      try {
        write = source.write(name.slice(source.prefix.length), value);
      } finally {
        this.applying.delete(name);
      }
      await write;
      logger.verbose(`Applied encrypted item ${name} from server`);
      if (this.state.timestamps[name] !== localTime) return;
    }

    this.state.timestamps[name] = serverTime;
    this.state.synced[name] = serverTime;
  }

  private findSource(name: string): EncryptedSyncSource | undefined {
    for (const source of this.sources.values()) {
      if (name.startsWith(source.prefix)) return source;
    }
    return undefined;
  }

  private async readLocalValues(): Promise<Map<string, unknown>> {
    const values = new Map<string, unknown>();
    for (const source of this.sources.values()) {
      const entries = await source.readAll();
      for (const [key, value] of Object.entries(entries)) {
        values.set(`${source.prefix}${key}`, value);
      }
    }
    return values;
  }

  private stampUntrackedValues(
    localValues: Map<string, unknown>,
    timestamps: Record<string, number>,
  ): void {
    const now = Date.now();
    let changed = false;
    for (const name of localValues.keys()) {
      if (timestamps[name] === undefined && this.state.timestamps[name] === undefined) {
        timestamps[name] = now;
        this.state.timestamps[name] = now;
        changed = true;
      }
    }
    if (changed) this.saveState();
  }

  private async push(
    localValues: Map<string, unknown>,
    timestamps: Record<string, number>,
  ): Promise<void> {
    const pending = Object.entries(timestamps).filter(
      ([name, updatedAt]) => this.state.synced[name] !== updatedAt && this.findSource(name),
    );

    for (let i = 0; i < pending.length; i += PUSH_BATCH_SIZE) {
      const batch = pending.slice(i, i + PUSH_BATCH_SIZE);
      const sealed = await invoke<SealedItem[]>("encrypted_sync_seal", {
        items: batch.map(([name]) => ({ name, value: localValues.get(name) ?? null })),
      });

      await serverFetch("/api/sync/encrypted", {
        method: "PUT",
        body: {
          vaultId: this.state.vaultId,
          items: sealed.map((item, index) => ({ ...item, updatedAt: batch[index][1] })),
        },
      });

      for (const [name, updatedAt] of batch) this.state.synced[name] = updatedAt;
      this.saveState();
      logger.verbose(`Pushed ${batch.length} encrypted items`);
    }
  }
}

export const encryptedSyncManager = new EncryptedSyncManager();

interface TrackableStorage {
  setItem: (key: string, value: never) => unknown;
  removeItem: (key: string) => unknown;
  trySetItem?: (key: string, value: never) => Promise<boolean>;
  tryRemoveItem?: (key: string) => Promise<boolean>;
}

type SyncedAtom = WritableAtom<unknown, [unknown], unknown>;

export function createEncryptedSyncGroup<T>(prefix: string, initialValue: T) {
  const atoms = new Map<string, SyncedAtom>();
  const isInitial = (value: unknown) => JSON.stringify(value) === JSON.stringify(initialValue);

  encryptedSyncManager.registerSource({
    prefix,
    readAll: async () => {
      const store = getDefaultStore();
      const entries = await Promise.all(
        [...atoms].map(async ([id, atom]) => [id, await store.get(atom)] as const),
      );
      return Object.fromEntries(entries.filter(([, value]) => !isInitial(value)));
    },
    write: async (id, value) => {
      const atom = atoms.get(id);
      if (!atom) return;
      let saved: unknown;
      if (value == null) saved = await getDefaultStore().set(atom, RESET);
      else if (typeof value === typeof initialValue)
        saved = await getDefaultStore().set(atom, value);
      if (saved === false) throw new Error(`Failed to save ${prefix}${id}`);
    },
  });

  return {
    atom<S extends TrackableStorage, A extends WritableAtom<unknown, never[], unknown>>(
      id: string,
      storage: S,
      create: (storage: S) => A,
    ): A {
      const name = `${prefix}${id}`;
      const created = create({
        ...storage,
        setItem: (key: string, value: never) => {
          const result = storage.trySetItem
            ? storage.trySetItem(key, value)
            : storage.setItem(key, value);
          encryptedSyncManager.markDirty(name);
          return result;
        },
        removeItem: (key: string) => {
          const result = storage.tryRemoveItem
            ? storage.tryRemoveItem(key)
            : storage.removeItem(key);
          encryptedSyncManager.markDirty(name);
          return result;
        },
      });
      atoms.set(id, created as unknown as SyncedAtom);
      return created;
    },
  };
}
