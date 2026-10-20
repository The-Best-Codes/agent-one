import { IconCircleCheck } from "@tabler/icons-react";
import { platform } from "@tauri-apps/plugin-os";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type ComputerUsePermission,
  type ComputerUsePermissions as Permissions,
  getComputerUsePermissions,
  requestComputerUsePermission,
} from "@/lib/computer-use";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const POLL_INTERVAL_MS = 2000;

const PERMISSION_INFO: Record<ComputerUsePermission, { name: string; description: string }> = {
  accessibility:
    platform() === "linux"
      ? {
          name: "Accessibility support",
          description:
            "Turns on your desktop's accessibility support so more apps show their buttons and text to AgentOne. Reopen any apps that were already open.",
        }
      : {
          name: "Accessibility",
          description:
            "Lets AgentOne read buttons and text in other apps, and click and type in them.",
        },
  screenRecording: {
    name: "Screen Recording",
    description:
      "Lets AgentOne see app windows and take screenshots. You may need to restart AgentOne after allowing it.",
  },
};

export function ComputerUsePermissions() {
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  const refresh = useCallback(() => {
    getComputerUsePermissions()
      .then(setPermissions)
      .catch((error: unknown) => {
        logger.error("Failed to check computer use permissions:", error);
      });
  }, []);

  const allGranted = permissions?.accessibility !== false && permissions?.screenRecording !== false;

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

  if (!permissions) return null;

  return (
    <div className="flex flex-col gap-4">
      {(Object.keys(PERMISSION_INFO) as ComputerUsePermission[]).map((permission) => {
        const info = PERMISSION_INFO[permission];
        const granted = permissions[permission];
        if (granted === undefined) return null;
        return (
          <div
            key={permission}
            className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center"
          >
            <div className="flex flex-1 flex-col items-start">
              <Label className="text-sm font-medium">{info.name}</Label>
              <p className="text-muted-foreground mt-1 text-sm">{info.description}</p>
            </div>
            {granted ? (
              <Badge variant="secondary">
                <IconCircleCheck data-icon="inline-start" />
                Allowed
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  requestComputerUsePermission(permission)
                    .then(refresh)
                    .catch((error: unknown) => {
                      logger.error(`Failed to request ${permission} permission:`, error);
                    });
                }}
              >
                Allow
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
