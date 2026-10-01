import { getDefaultStore } from "jotai";
import { useEffect } from "react";

import {
  downloadedModelDirectoryAtom,
  loadPersistedModelDirectory,
  MODEL_DIRECTORY_SYNC_CHECK_INTERVAL_MS,
  MODEL_DIRECTORY_SYNC_INTERVAL_MS,
  modelDirectoryStartupCompleteAtom,
  updateModelDirectory,
} from "@/lib/ai/models/model-directory";
import { lastModelDirectorySyncTimestampAtom } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";

const store = getDefaultStore();
const logger = getLogger(import.meta.url);

export function ModelDirectoryStartupSync() {
  useEffect(() => {
    let cancelled = false;
    let initialized = false;

    async function syncIfNeeded() {
      if (cancelled || !initialized) {
        return;
      }

      const lastSync = store.get(lastModelDirectorySyncTimestampAtom);
      if (
        store.get(downloadedModelDirectoryAtom) !== null &&
        Date.now() - lastSync < MODEL_DIRECTORY_SYNC_INTERVAL_MS
      ) {
        return;
      }

      try {
        const result = await updateModelDirectory();
        if (!cancelled && !result.ok) {
          logger.warn("Failed to update model directory", result.error);
        }
      } catch (error) {
        if (!cancelled) {
          logger.warn("Failed to sync model directory", error);
        }
      }
    }

    void (async () => {
      await loadPersistedModelDirectory();
      initialized = true;
      await syncIfNeeded();
    })()
      .catch((error) => {
        if (!cancelled) {
          logger.warn("Failed to sync model directory on startup", error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          store.set(modelDirectoryStartupCompleteAtom, true);
        }
      });

    const interval = setInterval(() => {
      void syncIfNeeded();
    }, MODEL_DIRECTORY_SYNC_CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return null;
}
