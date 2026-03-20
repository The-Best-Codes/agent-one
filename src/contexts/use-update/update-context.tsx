import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useAtom } from "jotai";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { updateRemindAfterAtom } from "@/lib/jotai/atoms";
import { getLogger } from "@/lib/logger";

import type { UpdateStatus } from "./update-contexts";
import { UpdateContext } from "./update-contexts";

const logger = getLogger(import.meta.url);

export const UpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateVersion, setUpdateVersion] = useState("");
  const [remindAfter, setRemindAfter] = useAtom(updateRemindAfterAtom);
  const hasCheckedRef = useRef(false);
  const [dialogDismissed, setDialogDismissed] = useState(() => {
    return remindAfter != null && Date.now() < remindAfter;
  });

  const checkForUpdates = useCallback(async () => {
    logger.verbose("Initiating update check.");
    try {
      setUpdateStatus("checking");

      const update = await check();
      logger.verbose(`Update check completed. Update found: ${!!update}.`);

      if (update) {
        setUpdateVersion(update.version);
        setUpdateStatus("available");
        logger.verbose(
          `Update version ${update.version} available. Setting status to 'available'.`,
        );
      } else {
        setUpdateStatus("up-to-date");
        logger.verbose("No update available. Setting status to 'up-to-date'.");
      }
    } catch (error) {
      setUpdateStatus("error");
      const message = error instanceof Error ? error.message : "Failed to check for updates";
      logger.error(`Error during update check: ${message}`, error);
    }
  }, []);

  const downloadAndInstallUpdate = useCallback(async () => {
    logger.verbose("Initiating download and install of update.");
    try {
      setUpdateStatus("downloading");
      setUpdateProgress(0);

      const update = await check();
      if (!update) {
        setUpdateStatus("error");
        logger.error("Update not found during download attempt.");
        return;
      }
      logger.verbose(`Confirmed update version ${update.version} for download.`);

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setUpdateProgress(0);
            break;
          case "Progress":
            setUpdateProgress((prev) => {
              const chunkLength = event.data.chunkLength;
              return Math.min(prev + (chunkLength / 1000) * 100, 100);
            });
            break;
          case "Finished":
            setUpdateProgress(100);
            setUpdateStatus("installing");
            break;
        }
      });

      setUpdateStatus("idle");
      logger.verbose("Update installation complete. Relaunching application.");
      await relaunch();
    } catch (error) {
      setUpdateStatus("error");
      const message = error instanceof Error ? error.message : "Failed to install update";
      logger.error(`Error during update: ${message}`, error);
    }
  }, []);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    if (dialogDismissed) return;
    const startCheck = async () => {
      await checkForUpdates();
    };
    void startCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dialogOpen = updateStatus === "available" && !dialogDismissed;

  const handleRemind = useCallback(
    (days: number) => {
      const until = Date.now() + days * 24 * 60 * 60 * 1000;
      setRemindAfter(until);
      setDialogDismissed(true);
    },
    [setRemindAfter],
  );

  const value = useMemo(
    () => ({
      updateStatus,
      updateProgress,
      updateVersion,
      checkForUpdates,
      downloadAndInstallUpdate,
      dialogOpen,
      handleRemind,
    }),
    [
      updateStatus,
      updateProgress,
      updateVersion,
      checkForUpdates,
      downloadAndInstallUpdate,
      dialogOpen,
      handleRemind,
    ],
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
};
