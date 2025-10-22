import { emit, listen } from "@tauri-apps/api/event";

import { getLogger } from "@/lib/logger";

import { createChecksum } from "../utils/checksum";
import { ConflictResolver } from "./conflict-resolver";
import type { SyncMessage } from "./types";

const logger = getLogger(import.meta.url);

const SYNC_EVENT_NAME = "agent-one:sync";

type SyncMessageCallback<T = unknown> = (message: SyncMessage<T>) => void;

export class SyncEngine {
  private listeners: Map<string, Set<SyncMessageCallback>> = new Map();
  private isInitialized = false;
  private unlistenFn: (() => void) | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.unlistenFn = await listen<SyncMessage>(SYNC_EVENT_NAME, (event) => {
        const message = event.payload;

        const callbackSet = this.listeners.get(message.entityType);
        if (callbackSet) {
          for (const callback of callbackSet) {
            try {
              callback(message);
            } catch (error) {
              logger.error(
                `Error in sync listener for ${message.entityType}`,
                error,
              );
            }
          }
        }
      });

      this.isInitialized = true;
      logger.verbose("SyncEngine initialized");
    } catch (error) {
      logger.error("Failed to initialize SyncEngine", error);
      throw error;
    }
  }

  async emit<T>(
    entityType: string,
    entityId: string,
    payload: T,
    operation: "update" | "delete" = "update",
  ): Promise<void> {
    const windowId = ConflictResolver.getWindowId();
    const version = ConflictResolver.getLocalVersion(entityType, entityId, 0);
    const nextVersion = version + 1;
    const timestamp = Date.now();

    ConflictResolver.setLocalVersion(entityType, entityId, nextVersion);
    ConflictResolver.setLocalTimestamp(entityType, entityId, timestamp);

    const message: SyncMessage<T> = {
      id: `${windowId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      entityType,
      entityId,
      operation,
      payload,
      version: nextVersion,
      timestamp,
      windowId,
      checksum: createChecksum(payload),
    };

    try {
      await emit(SYNC_EVENT_NAME, message);
      logger.verbose(`Emitted sync message: ${entityType}/${entityId}`, {
        version: nextVersion,
        timestamp,
      });
    } catch (error) {
      logger.error(
        `Failed to emit sync message for ${entityType}/${entityId}`,
        error,
      );
      throw error;
    }
  }

  on<T>(
    entityType: string,
    callback: (message: SyncMessage<T>) => void,
  ): () => void {
    if (!this.listeners.has(entityType)) {
      this.listeners.set(entityType, new Set());
    }

    const callbackSet = this.listeners.get(entityType)!;
    callbackSet.add(callback as SyncMessageCallback);

    return () => {
      callbackSet.delete(callback as SyncMessageCallback);
      if (callbackSet.size === 0) {
        this.listeners.delete(entityType);
      }
    };
  }

  destroy(): void {
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

let globalSyncEngine: SyncEngine | null = null;

export async function getSyncEngine(): Promise<SyncEngine> {
  if (!globalSyncEngine) {
    globalSyncEngine = new SyncEngine();
    await globalSyncEngine.initialize();
  }
  return globalSyncEngine;
}

export function getSyncEngineSync(): SyncEngine {
  if (!globalSyncEngine) {
    globalSyncEngine = new SyncEngine();
  }
  return globalSyncEngine;
}
