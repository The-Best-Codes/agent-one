import { invoke } from "@tauri-apps/api/core";

import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const CACHE_TTL_MS = 30_000;

export interface ProjectEntry {
  path: string;
  name: string;
  isDirectory: boolean;
}

const cache = new Map<string, { loadedAt: number; entries: ProjectEntry[] }>();
const pending = new Map<string, Promise<ProjectEntry[]>>();

export function listProjectEntries(folder: string): Promise<ProjectEntry[]> {
  const cached = cache.get(folder);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return Promise.resolve(cached.entries);
  let refresh = pending.get(folder);
  if (!refresh) {
    refresh = invoke<ProjectEntry[]>("list_project_files", { folder })
      .then((entries) => {
        cache.set(folder, { loadedAt: Date.now(), entries });
        return entries;
      })
      .catch((error: unknown) => {
        logger.warn(`Failed to list files in ${folder}`, error);
        return cached?.entries ?? [];
      })
      .finally(() => pending.delete(folder));
    pending.set(folder, refresh);
  }
  return cached ? Promise.resolve(cached.entries) : refresh;
}
