import { useEffect, useRef } from "react";

import { getLogger } from "@/lib/logger";

import { getSyncEngine } from "../core/sync-engine";
import type { SyncMessage } from "../core/types";

const logger = getLogger(import.meta.url);

export function useSyncListener<T>(
  entityType: string,
  callback: (message: SyncMessage<T>) => void | Promise<void>,
  enabled: boolean = true,
): void {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    async function setupListener() {
      try {
        const engine = await getSyncEngine();
        unsubscribeRef.current = engine.on<T>(entityType, async (message) => {
          try {
            await callback(message);
          } catch (error) {
            logger.error(`Error in sync listener for ${entityType}`, error);
          }
        });

        logger.verbose(`Sync listener setup for ${entityType}`);
      } catch (error) {
        logger.error(`Failed to setup sync listener for ${entityType}`, error);
      }
    }

    setupListener();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [entityType, callback, enabled]);
}
