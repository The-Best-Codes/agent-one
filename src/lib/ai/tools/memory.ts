import { tool } from "ai";
import { getDefaultStore } from "jotai";
import { z } from "zod";

import type { ChatToolsContext } from "@/lib/ai/tools/readChat";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import {
  hasMemoryEntry,
  removeMemoryEntries,
  sanitizeMemoryEntries,
  sanitizeMemoryEntry,
} from "@/lib/memory";
import { getProject, updateProject } from "@/lib/projects";
import type { MemoryToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

const memoryOperationSchema = z.object({
  operation: z.enum(["add", "remove", "replace"]),
  entries: z.array(z.string().min(1)).max(20).optional(),
  oldEntry: z.string().optional(),
  newEntry: z.string().optional(),
});

function getMemorySummary(entries: string[]) {
  return entries.length === 0
    ? "Memory is empty."
    : `${entries.length} memory entr${entries.length === 1 ? "y" : "ies"}.`;
}

function getMemoryStore(context: ChatToolsContext) {
  const projectId = context.project?.separateMemory ? context.project.id : undefined;
  const store = getDefaultStore();
  return {
    get: () => (projectId ? (getProject(projectId)?.memory ?? []) : store.get(settingAtoms.MEMORY)),
    set: (memory: string[]) => {
      if (projectId) {
        updateProject(projectId, { memory });
      } else {
        store.set(settingAtoms.MEMORY, memory);
      }
    },
  };
}

export const createMemoryTool = (config: MemoryToolConfig, context: ChatToolsContext) =>
  tool({
    description:
      "Store long-term memory. Use this to add, remove, or replace concise memory entries that you can reference in later conversations. Keep entries short, stable, non-duplicative, and free of contradictions.",
    needsApproval: config.requiresApproval,
    inputSchema: memoryOperationSchema,
    execute: async (input) => {
      logger.verbose("Executing memory tool with input:", input);

      const memoryStore = getMemoryStore(context);
      let entries = sanitizeMemoryEntries(memoryStore.get());

      if (input.operation === "add") {
        const added: string[] = [];

        for (const rawEntry of input.entries ?? []) {
          const entry = sanitizeMemoryEntry(rawEntry);
          if (!entry || hasMemoryEntry(entries, entry)) continue;
          entries = sanitizeMemoryEntries([...entries, entry]);
          added.push(entry);
        }

        const nextMemory = entries;
        memoryStore.set(nextMemory);

        return {
          action: "add",
          added,
          memory: nextMemory,
          summary: getMemorySummary(entries),
        };
      }

      if (input.operation === "remove") {
        const normalizedEntries = (input.entries ?? []).map((entry) => sanitizeMemoryEntry(entry));
        const nextEntries = sanitizeMemoryEntries(removeMemoryEntries(entries, normalizedEntries));
        const removed = entries.filter((entry) => !hasMemoryEntry(nextEntries, entry));
        const nextMemory = nextEntries;
        memoryStore.set(nextMemory);

        return {
          action: "remove",
          removed,
          memory: nextMemory,
          summary: getMemorySummary(nextEntries),
        };
      }

      const oldEntry = sanitizeMemoryEntry(input.oldEntry ?? "");
      const newEntry = sanitizeMemoryEntry(input.newEntry ?? "");
      const withoutOld = removeMemoryEntries(entries, [oldEntry]);
      const replaced = withoutOld.length !== entries.length;
      const nextEntries = sanitizeMemoryEntries(
        newEntry && !hasMemoryEntry(withoutOld, newEntry) ? [...withoutOld, newEntry] : withoutOld,
      );
      const nextMemory = nextEntries;
      memoryStore.set(nextMemory);

      return {
        action: "replace",
        replaced,
        oldEntry,
        newEntry,
        memory: nextMemory,
        summary: getMemorySummary(nextEntries),
      };
    },
  });
