import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export async function checkNotificationPermission(): Promise<boolean> {
  try {
    return await isPermissionGranted();
  } catch (error) {
    logger.error("Failed to check notification permission:", error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await requestPermission();
    return permission === "granted";
  } catch (error) {
    logger.error("Failed to request notification permission:", error);
    return false;
  }
}

export async function sendNotificationIfAllowed(
  title: string,
  body: string,
): Promise<boolean> {
  try {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      permissionGranted = await requestNotificationPermission();
    }

    if (permissionGranted) {
      sendNotification({
        title,
        body,
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Failed to send notification:", error);
    return false;
  }
}
