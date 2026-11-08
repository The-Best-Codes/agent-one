import { useCallback, useEffect, useRef, useState } from "react";

import { type ComputerUsePermissions, getComputerUsePermissions } from "@/lib/computer-use";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const POLL_INTERVAL_MS = 2000;

export function useComputerUsePermissions() {
  const [permissions, setPermissions] = useState<ComputerUsePermissions | null>(null);

  const latestRequestRef = useRef(0);

  const refresh = useCallback(() => {
    const requestId = ++latestRequestRef.current;
    getComputerUsePermissions()
      .then((result) => {
        if (requestId === latestRequestRef.current) setPermissions(result);
      })
      .catch((error: unknown) => {
        logger.error("Failed to check computer use permissions:", error);
      });
  }, []);

  const allGranted = permissions?.accessibility && permissions.screenRecording;

  useEffect(() => {
    refresh();
    if (allGranted) return;
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh, allGranted]);

  return { permissions, refresh };
}
