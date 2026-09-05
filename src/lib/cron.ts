import { invoke } from "@tauri-apps/api/core";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export interface LaunchCronState {
  enabled: boolean;
  time: string | null;
}

export async function getLaunchCron(): Promise<LaunchCronState> {
  try {
    return await invoke<LaunchCronState>("get_launch_cron");
  } catch (error) {
    logger.error("Failed to get launch cron:", error);
    throw error;
  }
}

export async function setLaunchCron(time: string): Promise<LaunchCronState> {
  try {
    return await invoke<LaunchCronState>("set_launch_cron", { time });
  } catch (error) {
    logger.error("Failed to set launch cron:", error);
    throw error;
  }
}

export async function clearLaunchCron(): Promise<LaunchCronState> {
  try {
    return await invoke<LaunchCronState>("clear_launch_cron");
  } catch (error) {
    logger.error("Failed to clear launch cron:", error);
    throw error;
  }
}
