import { invoke } from "@tauri-apps/api/core";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export interface Cron {
  id: string;
  schedule: string;
  message: string | null;
  enabled: boolean;
}

export interface CronInvocation {
  id: string;
  message: string | null;
  delaySeconds: number;
}

export async function listCrons(): Promise<Cron[]> {
  try {
    return await invoke<Cron[]>("list_crons");
  } catch (error) {
    logger.error("Failed to list crons:", error);
    throw error;
  }
}

export async function createCron(schedule: string, message: string | null): Promise<Cron> {
  try {
    return await invoke<Cron>("create_cron", { schedule, message });
  } catch (error) {
    logger.error("Failed to create cron:", error);
    throw error;
  }
}

export async function updateCron(
  id: string,
  schedule: string,
  message: string | null,
): Promise<Cron> {
  try {
    return await invoke<Cron>("update_cron", { id, schedule, message });
  } catch (error) {
    logger.error("Failed to update cron:", error);
    throw error;
  }
}

export async function setCronEnabled(id: string, enabled: boolean): Promise<Cron> {
  try {
    return await invoke<Cron>("set_cron_enabled", { id, enabled });
  } catch (error) {
    logger.error("Failed to change cron state:", error);
    throw error;
  }
}

export async function deleteCron(id: string): Promise<void> {
  try {
    await invoke("delete_cron", { id });
  } catch (error) {
    logger.error("Failed to delete cron:", error);
    throw error;
  }
}

export async function getCronInvocation(id: string): Promise<CronInvocation | null> {
  try {
    return await invoke<CronInvocation | null>("get_cron_invocation", { id });
  } catch (error) {
    logger.error("Failed to resolve cron invocation:", error);
    throw error;
  }
}
