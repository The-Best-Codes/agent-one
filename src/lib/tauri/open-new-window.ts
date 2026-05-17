import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export const openNewWindow = (path = "/") => {
  const label = `a1-instance-${crypto.randomUUID()}`;
  const webview = new WebviewWindow(label, {
    url: path,
    title: "AgentOne",
    width: 800,
    height: 600,
  });

  webview.once("tauri://created", () => {
    logger.verbose("New window created", { label, path });
  });
  webview.once("tauri://error", (error) => {
    logger.error("Failed to create new window", { label, path, error });
  });
};
