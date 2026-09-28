import { invoke } from "@tauri-apps/api/core";

import type { ModelConfig } from "@/hooks/ai/use-model-catalog";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);
export const SCHEDULED_AGENTS_CHANGED_EVENT = "agent-one-scheduled-agents-changed";

function notifyScheduledAgentsChanged() {
  window.dispatchEvent(new Event(SCHEDULED_AGENTS_CHANGED_EVENT));
}

interface CronBase {
  id: string;
  schedule: string;
  enabled: boolean;
}

export interface CronTest extends CronBase {
  type: "cron-test";
  message: string | null;
}

export interface ScheduledAgent extends CronBase {
  type: "scheduled-agent";
  title: string;
  prompt: string;
  modelId: string | null;
  modelConfig: ModelConfig | null;
  delayCutoffSeconds: number | null;
}

export type Cron = CronTest | ScheduledAgent;

export type CronInvocation = {
  id: string;
  delaySeconds: number;
} & (
  | { type: "cron-test"; message: string | null }
  | {
      type: "scheduled-agent";
      title: string;
      prompt: string;
      modelId: string | null;
      modelConfig: ModelConfig | null;
      delayCutoffSeconds: number | null;
    }
);

export async function listCrons(): Promise<CronTest[]> {
  try {
    return await invoke<CronTest[]>("list_crons");
  } catch (error) {
    logger.error("Failed to list crons:", error);
    throw error;
  }
}

export async function createCron(schedule: string, message: string | null): Promise<CronTest> {
  try {
    return await invoke<CronTest>("create_cron", { schedule, message });
  } catch (error) {
    logger.error("Failed to create cron:", error);
    throw error;
  }
}

export async function updateCron(
  id: string,
  schedule: string,
  message: string | null,
): Promise<CronTest> {
  try {
    return await invoke<CronTest>("update_cron", { id, schedule, message });
  } catch (error) {
    logger.error("Failed to update cron:", error);
    throw error;
  }
}

export async function setCronEnabled(id: string, enabled: boolean): Promise<CronTest> {
  try {
    return await invoke<CronTest>("set_cron_enabled", { id, enabled });
  } catch (error) {
    logger.error("Failed to change cron state:", error);
    throw error;
  }
}

export async function listScheduledAgents(): Promise<ScheduledAgent[]> {
  return invoke<ScheduledAgent[]>("list_scheduled_agents");
}

export async function createScheduledAgent(
  title: string,
  schedule: string,
  prompt: string,
): Promise<ScheduledAgent> {
  const agent = await invoke<ScheduledAgent>("create_scheduled_agent", { title, schedule, prompt });
  notifyScheduledAgentsChanged();
  return agent;
}

export async function updateScheduledAgent(
  id: string,
  title: string,
  schedule: string,
  prompt: string,
): Promise<ScheduledAgent> {
  const agent = await invoke<ScheduledAgent>("update_scheduled_agent", {
    id,
    title,
    schedule,
    prompt,
  });
  notifyScheduledAgentsChanged();
  return agent;
}

export async function setScheduledAgentEnabled(
  id: string,
  enabled: boolean,
): Promise<ScheduledAgent> {
  const agent = await invoke<ScheduledAgent>("set_scheduled_agent_enabled", { id, enabled });
  notifyScheduledAgentsChanged();
  return agent;
}

export async function deleteScheduledAgent(id: string): Promise<void> {
  await invoke("delete_scheduled_agent", { id });
  notifyScheduledAgentsChanged();
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
