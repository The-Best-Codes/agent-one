import { openUrl } from "@tauri-apps/plugin-opener";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export function openExternalUrl(url: string, openWith?: string) {
  void openUrl(url, openWith).catch((error: unknown) => {
    logger.error("Failed to open external link", error);
  });
}
