import { emit, listen } from "@tauri-apps/api/event";

import { getLogger } from "@/lib/logger";

import type { SyncConfig, SyncEngineInstance } from "./sync-types";

const logger = getLogger(import.meta.url);

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) =>
      isEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  return false;
}

const syncInstances = new Map<string, SyncEngineInstance>();

export class SyncEngine {
  static registerSync(
    key: string,
    config: Omit<SyncConfig, "key">,
  ): SyncEngineInstance {
    if (syncInstances.has(key)) {
      return syncInstances.get(key)!;
    }

    const instance: SyncEngineInstance = {
      isProcessingUpdate: false,
      hasHydrated: false,
      listeners: [],
      config: { key, ...config },
    };

    syncInstances.set(key, instance);

    if (config.logging) {
      logger.info(`Sync engine registered for key: ${key}`);
    }

    return instance;
  }

  static async broadcastUpdate<T>(key: string, data: T): Promise<void> {
    const instance = syncInstances.get(key);
    if (!instance) {
      logger.warn(`Sync engine not found for key: ${key}`);
      return;
    }

    if (instance.isProcessingUpdate) {
      if (instance.config.logging) {
        logger.debug(
          `Skipping broadcast for ${key} - already processing update`,
        );
      }
      return;
    }

    try {
      await emit(`sync:${key}:update`, data);
      if (instance.config.logging) {
        logger.debug(`Broadcasted sync update for key: ${key}`);
      }
    } catch (error) {
      logger.error(`Failed to broadcast sync update for key: ${key}`, error);
    }
  }

  static async hydrateRequest(key: string): Promise<void> {
    try {
      await emit(`sync:${key}:hydrate-request`);
      if (syncInstances.get(key)?.config.logging) {
        logger.debug(`Sent hydration request for key: ${key}`);
      }
    } catch (error) {
      logger.error(`Failed to send hydration request for key: ${key}`, error);
    }
  }

  static onUpdate<T>(
    key: string,
    callback: (data: T) => void,
  ): () => Promise<void> {
    return async () => {
      const unlisten = await listen<T>(`sync:${key}:update`, (event) => {
        const instance = syncInstances.get(key);
        if (!instance) return;

        if (instance.config.deepCompare && !isEqual(event.payload, null)) {
          callback(event.payload);
        } else if (!instance.config.deepCompare) {
          callback(event.payload);
        }
      });
      unlisten();
    };
  }

  static onHydrateRequest(
    key: string,
    getter: () => unknown,
  ): () => Promise<void> {
    return async () => {
      const unlisten = await listen(`sync:${key}:hydrate-request`, async () => {
        const instance = syncInstances.get(key);
        if (!instance) return;

        try {
          const currentState = getter();
          await emit(`sync:${key}:hydrate-response`, currentState);
          if (instance.config.logging) {
            logger.debug(`Responded to hydration request for key: ${key}`);
          }
        } catch (error) {
          logger.error(
            `Failed to respond to hydration request for key: ${key}`,
            error,
          );
        }
      });
      unlisten();
    };
  }

  static onHydrateResponse<T>(
    key: string,
    setter: (data: T) => void,
  ): () => Promise<void> {
    return async () => {
      const unlisten = await listen<T>(
        `sync:${key}:hydrate-response`,
        (event) => {
          const instance = syncInstances.get(key);
          if (!instance) return;

          if (!instance.hasHydrated) {
            instance.isProcessingUpdate = true;
            setter(event.payload);
            instance.isProcessingUpdate = false;
            instance.hasHydrated = true;

            if (instance.config.logging) {
              logger.debug(`Hydrated from response for key: ${key}`);
            }
          }
        },
      );
      unlisten();
    };
  }

  static setProcessing(key: string, isProcessing: boolean): void {
    const instance = syncInstances.get(key);
    if (instance) {
      instance.isProcessingUpdate = isProcessing;
    }
  }

  static setHydrated(key: string, hasHydrated: boolean): void {
    const instance = syncInstances.get(key);
    if (instance) {
      instance.hasHydrated = hasHydrated;
    }
  }

  static getState(key: string): SyncEngineInstance | undefined {
    return syncInstances.get(key);
  }

  static destroy(key: string): void {
    const instance = syncInstances.get(key);
    if (instance) {
      instance.listeners.forEach((unlisten) => unlisten());
      instance.listeners = [];
      syncInstances.delete(key);

      if (instance.config.logging) {
        logger.debug(`Destroyed sync engine for key: ${key}`);
      }
    }
  }
}
