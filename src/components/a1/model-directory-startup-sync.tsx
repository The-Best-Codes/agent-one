import { getDefaultStore } from "jotai";
import { useEffect } from "react";

import {
  loadPersistedModelDirectory,
  MODEL_DIRECTORY_SYNC_INTERVAL_MS,
  updateModelDirectory,
} from "@/lib/ai/models/model-directory";
import { lastModelDirectorySyncTimestampAtom } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";

const store = getDefaultStore();
const logger = getLogger(import.meta.url);

export function ModelDirectoryStartupSync() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadPersistedModelDirectory();
      if (cancelled) {
        return;
      }

      const lastSync = store.get(lastModelDirectorySyncTimestampAtom);
      if (Date.now() - lastSync < MODEL_DIRECTORY_SYNC_INTERVAL_MS) {
        return;
      }

      const result = await updateModelDirectory();
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        logger.warn("Failed to update model directory on startup", result.error);
      }
    })().catch((error) => {
      if (!cancelled) {
        logger.warn("Failed to sync model directory on startup", error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
