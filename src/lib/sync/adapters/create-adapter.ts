import { getLogger } from "@/lib/logger";

import { ConflictResolver } from "../core/conflict-resolver";
import { getSyncEngine } from "../core/sync-engine";
import type {
  SyncAdapterConfig,
  SyncAdapterInstance,
  SyncMessage,
} from "../core/types";

const logger = getLogger(import.meta.url);

export function createAdapter<T, C>(
  config: SyncAdapterConfig<T, C>,
): SyncAdapterInstance<T, C> {
  const {
    entityType,
    selector,
    onRemoteChange,
    conflictResolution = "last-write-wins",
  } = config;

  return {
    config,
    entityType,

    getLocalData(context: C): T {
      return selector(context);
    },

    async handleRemoteChange(
      message: SyncMessage<T>,
      context: C,
    ): Promise<void> {
      if (message.operation === "delete") {
        await onRemoteChange(message.payload, context);
        return;
      }

      const localData = selector(context);
      const localVersion = ConflictResolver.getLocalVersion(
        entityType,
        message.entityId,
        0,
      );
      const localTimestamp = ConflictResolver.getLocalTimestamp(
        entityType,
        message.entityId,
        0,
      );
      const windowId = ConflictResolver.getWindowId();

      const shouldAccept = ConflictResolver.shouldAccept({
        incomingVersion: message.version,
        incomingTimestamp: message.timestamp,
        incomingWindowId: message.windowId,
        localVersion,
        localTimestamp,
        localWindowId: windowId,
      });

      if (!shouldAccept) {
        logger.verbose(
          `Rejected remote change for ${entityType}/${message.entityId} (incoming v${message.version} < local v${localVersion})`,
        );
        return;
      }

      let resolvedData = message.payload;

      if (localVersion > 0 && localVersion === message.version) {
        resolvedData = ConflictResolver.resolve(
          message.payload,
          localData,
          conflictResolution,
        );
      }

      ConflictResolver.setLocalVersion(
        entityType,
        message.entityId,
        message.version,
      );
      ConflictResolver.setLocalTimestamp(
        entityType,
        message.entityId,
        message.timestamp,
      );

      await onRemoteChange(resolvedData, context);
    },

    getLocalVersion(entityId: string): number {
      return ConflictResolver.getLocalVersion(entityType, entityId, 0);
    },

    incrementVersion(entityId: string): void {
      const current = ConflictResolver.getLocalVersion(entityType, entityId, 0);
      ConflictResolver.setLocalVersion(entityType, entityId, current + 1);
      ConflictResolver.setLocalTimestamp(entityType, entityId, Date.now());
    },
  };
}

export async function setupSyncListener<T, C>(
  adapter: SyncAdapterInstance<T, C>,
  context: C,
): Promise<() => void> {
  const engine = await getSyncEngine();

  const unsubscribe = engine.on<T>(adapter.entityType, async (message) => {
    try {
      await adapter.handleRemoteChange(message, context);
    } catch (error) {
      logger.error(
        `Error handling remote change for ${adapter.entityType}`,
        error,
      );
    }
  });

  return unsubscribe;
}

export async function emitSyncMessage<T>(
  entityType: string,
  entityId: string,
  payload: T,
  operation: "update" | "delete" = "update",
): Promise<void> {
  const engine = await getSyncEngine();
  await engine.emit(entityType, entityId, payload, operation);
}
