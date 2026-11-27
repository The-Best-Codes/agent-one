import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { getDefaultStore, useAtomValue, useSetAtom } from "jotai";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { updatesManagedExternallyAtom } from "@/lib/jotai/atoms";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

import type { UpdateStatus } from "./update-contexts";
import { UpdateContext } from "./update-contexts";

const logger = getLogger(import.meta.url);

const TOAST_ID = "app-update";
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const IS_WINDOWS = platform() === "windows";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

export const UpdateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateProgress, setUpdateProgress] = useState<number | null>(null);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateInstalled, setUpdateInstalled] = useState(false);
  const autoUpdate = useAtomValue(settingAtoms.AUTO_UPDATE);
  const setManagedExternally = useSetAtom(updatesManagedExternallyAtom);

  const pendingUpdateRef = useRef<Update | null>(null);
  const readyVersionRef = useRef<string | null>(null);
  const installedRef = useRef(false);
  const busyRef = useRef(false);
  const notifiedRef = useRef(new Set<string>());
  const hasCheckedRef = useRef(false);

  const replacePendingUpdate = useCallback((update: Update | null) => {
    const previous = pendingUpdateRef.current;
    pendingUpdateRef.current = update;
    if (previous && previous !== update) {
      void previous.close().catch(() => undefined);
    }
  }, []);

  const finishUpdate = useCallback(async () => {
    if (installedRef.current) {
      logger.verbose("Relaunching to apply installed update.");
      await relaunch();
      return;
    }

    const update = pendingUpdateRef.current;
    if (!update || busyRef.current) return;
    try {
      busyRef.current = true;
      toast.dismiss(TOAST_ID);
      setUpdateStatus("installing");
      setUpdateError(null);
      logger.verbose(`Installing downloaded update ${update.version}.`);
      await update.install();
      installedRef.current = true;
      setUpdateInstalled(true);
      await relaunch();
    } catch (error) {
      setUpdateStatus("error");
      setUpdateError(errorMessage(error, "Failed to install update"));
      logger.error("Error installing update.", error);
    } finally {
      busyRef.current = false;
    }
  }, []);

  const notifyReady = useCallback(
    (version: string) => {
      const key = `ready:${version}`;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);
      if (installedRef.current) {
        toast.info(`AgentOne v${version} is ready`, {
          id: TOAST_ID,
          description: "It'll be used next time you open AgentOne.",
          duration: Infinity,
          action: { label: "Restart now", onClick: () => void finishUpdate() },
        });
      } else {
        toast.info(`AgentOne v${version} is ready to install`, {
          id: TOAST_ID,
          description: IS_WINDOWS
            ? "AgentOne will close while the update installs."
            : "AgentOne will restart after the update installs.",
          duration: Infinity,
          action: { label: "Install", onClick: () => void finishUpdate() },
        });
      }
    },
    [finishUpdate],
  );

  const downloadUpdate = useCallback(
    async (update: Update) => {
      if (busyRef.current) return;
      try {
        busyRef.current = true;
        toast.dismiss(TOAST_ID);
        readyVersionRef.current = null;
        installedRef.current = false;
        setUpdateInstalled(false);
        setUpdateVersion(update.version);
        setUpdateStatus("downloading");
        setUpdateProgress(null);
        setUpdateError(null);
        logger.verbose(`Downloading update ${update.version}.`);

        let contentLength: number | undefined;
        let downloaded = 0;
        await update.download((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength;
              downloaded = 0;
              setUpdateProgress(contentLength ? 0 : null);
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              if (contentLength) {
                setUpdateProgress(Math.min((downloaded / contentLength) * 100, 100));
              }
              break;
            case "Finished":
              setUpdateProgress(100);
              break;
          }
        });

        let installInBackground = false;
        try {
          installInBackground = await invoke<boolean>("can_install_update_in_background");
        } catch (error) {
          logger.error("Failed to determine whether updates can install in the background.", error);
        }

        if (installInBackground) {
          setUpdateStatus("installing");
          logger.verbose(`Installing update ${update.version} for next launch.`);
          await update.install();
          installedRef.current = true;
          setUpdateInstalled(true);
        }

        readyVersionRef.current = update.version;
        setUpdateStatus("ready");
        logger.verbose(`Update ${update.version} is ready.`);
        notifyReady(update.version);
      } catch (error) {
        setUpdateStatus("error");
        setUpdateError(errorMessage(error, "Failed to download update"));
        logger.error("Error downloading update.", error);
      } finally {
        busyRef.current = false;
      }
    },
    [notifyReady],
  );

  const checkForUpdates = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const hasKnownUpdate = readyVersionRef.current !== null || pendingUpdateRef.current !== null;
    logger.verbose("Initiating update check.");
    try {
      let managedExternally = false;
      try {
        managedExternally = await invoke<boolean>("is_update_managed_externally");
      } catch (error) {
        logger.error("Failed to determine whether updates are externally managed.", error);
      }

      if (managedExternally) {
        setManagedExternally(true);
        setUpdateStatus("managed-externally");
        logger.verbose("Updates are managed externally. Skipping built-in updater.");
        return;
      }

      if (!hasKnownUpdate) {
        setUpdateStatus("checking");
        setUpdateError(null);
      }

      const update = await check();
      logger.verbose(`Update check completed. Update found: ${update?.version ?? "none"}.`);

      if (!update) {
        if (!hasKnownUpdate) setUpdateStatus("up-to-date");
        return;
      }

      if (update.version === readyVersionRef.current) {
        void update.close().catch(() => undefined);
        setUpdateStatus("ready");
        setUpdateError(null);
        return;
      }

      replacePendingUpdate(update);

      if (getDefaultStore().get(settingAtoms.AUTO_UPDATE)) {
        busyRef.current = false;
        await downloadUpdate(update);
        return;
      }

      readyVersionRef.current = null;
      setUpdateVersion(update.version);
      setUpdateStatus("available");
      const key = `available:${update.version}`;
      if (!notifiedRef.current.has(key)) {
        notifiedRef.current.add(key);
        toast.info(`AgentOne v${update.version} is available`, {
          id: TOAST_ID,
          duration: Infinity,
          action: {
            label: "Update",
            onClick: () => {
              const pending = pendingUpdateRef.current;
              if (pending) void downloadUpdate(pending);
            },
          },
        });
      }
    } catch (error) {
      if (!hasKnownUpdate) {
        setUpdateStatus("error");
        setUpdateError(errorMessage(error, "Failed to check for updates"));
      }
      logger.error("Error during update check.", error);
    } finally {
      busyRef.current = false;
    }
  }, [downloadUpdate, replacePendingUpdate, setManagedExternally]);

  const downloadAndInstallUpdate = useCallback(async () => {
    const pending = pendingUpdateRef.current;
    if (pending && readyVersionRef.current === null) {
      await downloadUpdate(pending);
      return;
    }
    await checkForUpdates();
  }, [checkForUpdates, downloadUpdate]);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    void checkForUpdates();
  }, [checkForUpdates]);

  const managedExternally = updateStatus === "managed-externally";

  useEffect(() => {
    if (managedExternally) return;
    const interval = setInterval(() => void checkForUpdates(), CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkForUpdates, managedExternally]);

  useEffect(() => {
    if (!autoUpdate || updateStatus !== "available") return;
    const pending = pendingUpdateRef.current;
    if (pending && !busyRef.current) void downloadUpdate(pending);
  }, [autoUpdate, updateStatus, downloadUpdate]);

  const value = useMemo(
    () => ({
      updateStatus,
      updateProgress,
      updateVersion,
      updateError,
      updateInstalled,
      isWindows: IS_WINDOWS,
      checkForUpdates,
      downloadAndInstallUpdate,
      finishUpdate,
    }),
    [
      updateStatus,
      updateProgress,
      updateVersion,
      updateError,
      updateInstalled,
      checkForUpdates,
      downloadAndInstallUpdate,
      finishUpdate,
    ],
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
};
