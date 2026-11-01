import { onAction } from "@tauri-apps/plugin-notification";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export function NotificationClickHandler() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let disposed = false;

    onAction((event) => {
      if (event.actionId !== "tap") return;

      const chatId = event.notification?.extra?.chatId;
      if (typeof chatId === "string") {
        void navigateRef.current(`/chat/${chatId}`);
      }
    })
      .then((listener) => {
        if (disposed) {
          void listener.unregister();
        } else {
          unlisten = () => void listener.unregister();
        }
      })
      .catch((error) => {
        logger.warn("Failed to setup notification click handler:", error);
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  return null;
}
