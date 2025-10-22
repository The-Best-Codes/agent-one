import { useEffect, useRef } from "react";

import { getLogger } from "@/lib/logger";

import {
  createAdapter,
  emitSyncMessage,
  setupSyncListener,
} from "../adapters/create-adapter";
import type { SyncAdapterConfig } from "../core/types";

const logger = getLogger(import.meta.url);

export function useSyncAdapter<T, C>(
  config: SyncAdapterConfig<T, C>,
  context: C,
  enabled: boolean = true,
): void {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const adapterRef = useRef(createAdapter(config));

  useEffect(() => {
    if (!enabled) {
      return;
    }

    async function setupListener() {
      try {
        if (!unsubscribeRef.current) {
          unsubscribeRef.current = await setupSyncListener(
            adapterRef.current,
            context,
          );
        }

        logger.verbose(`Sync adapter setup for ${config.entityType}`);
      } catch (error) {
        logger.error(
          `Failed to setup sync adapter for ${config.entityType}`,
          error,
        );
      }
    }

    setupListener();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [config, context, enabled]);
}

export function useSyncEmit<T>(
  entityType: string,
  entityId: string,
): (payload: T, operation?: "update" | "delete") => Promise<void> {
  return async (payload: T, operation = "update") => {
    try {
      await emitSyncMessage(entityType, entityId, payload, operation);
    } catch (error) {
      logger.error(
        `Failed to emit sync message for ${entityType}/${entityId}`,
        error,
      );
      throw error;
    }
  };
}
