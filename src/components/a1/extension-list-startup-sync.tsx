import { getDefaultStore } from "jotai";
import { useEffect } from "react";

import {
  MODEL_DIRECTORY_SYNC_CHECK_INTERVAL_MS,
  MODEL_DIRECTORY_SYNC_INTERVAL_MS,
} from "@/lib/ai/models/model-directory";
import {
  extensionListStatusAtom,
  syncExtensionListOnStartup,
  updateExtensionList,
} from "@/lib/mcp-registry/sync";

const store = getDefaultStore();

export function ExtensionListStartupSync() {
  useEffect(() => {
    void syncExtensionListOnStartup();
    const interval = setInterval(() => {
      const status = store.get(extensionListStatusAtom);
      if (!status.isStartupComplete || status.isUpdating) return;
      if (
        !status.hasDownloadedList ||
        Date.now() - status.fetchedAt >= MODEL_DIRECTORY_SYNC_INTERVAL_MS
      ) {
        void updateExtensionList();
      }
    }, MODEL_DIRECTORY_SYNC_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}
