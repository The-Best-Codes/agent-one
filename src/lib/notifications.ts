import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  Visibility,
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
  chatId?: string,
): Promise<boolean> {
  try {
    // TODO: Desktop always reports the permission as granted. Restore these checks if we target mobile.
    // let permissionGranted = await isPermissionGranted();
    //
    // if (!permissionGranted) {
    //   permissionGranted = await requestNotificationPermission();
    // }
    //
    // if (!permissionGranted) {
    //   return false;
    // }

    sendNotification({
      title,
      body,
      silent: false,
      visibility: Visibility.Public,
      extra: chatId ? { chatId } : undefined,
    });
    return true;
  } catch (error) {
    logger.error("Failed to send notification:", error);
    return false;
  }
}
