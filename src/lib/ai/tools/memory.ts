import { tool } from "ai";
import { getDefaultStore } from "jotai";
import { z } from "zod";

import { memoryAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import {
  hasMemoryEntry,
  removeMemoryEntries,
  sanitizeMemoryEntries,
  sanitizeMemoryEntry,
} from "@/lib/memory";
import type { MemoryToolConfig } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

const memoryOperationSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("add"),
    entries: z.array(z.string().min(1)).min(1).max(20),
  }),
  z.object({
    operation: z.literal("remove"),
    entries: z.array(z.string().min(1)).min(1).max(20),
  }),
  z.object({
    operation: z.literal("replace"),
    oldEntry: z.string().min(1),
    newEntry: z.string().min(1),
  }),
]);

function getMemorySummary(entries: string[]) {
  return entries.length === 0
    ? "Memory is empty."
    : `${entries.length} memory entr${entries.length === 1 ? "y" : "ies"}.`;
}

export const createMemoryTool = (config: MemoryToolConfig) =>
  tool({
    description:
      "Maintain the user's long-term memory. Use this to add, remove, or replace concise memory entries without rewriting the whole memory block. Keep entries short, stable, non-duplicative, and free of contradictions.",
    needsApproval: config.requiresApproval,
    inputSchema: memoryOperationSchema,
    execute: async (input) => {
      logger.verbose("Executing memory tool with input:", input);

      const store = getDefaultStore();
      let entries = sanitizeMemoryEntries(store.get(memoryAtom));

      if (input.operation === "add") {
        const added: string[] = [];

        for (const rawEntry of input.entries) {
          const entry = sanitizeMemoryEntry(rawEntry);
          if (!entry || hasMemoryEntry(entries, entry)) continue;
          entries = sanitizeMemoryEntries([...entries, entry]);
          added.push(entry);
        }

        const nextMemory = entries;
        store.set(memoryAtom, nextMemory);

        return {
          action: "add",
          added,
          memory: nextMemory,
          summary: getMemorySummary(entries),
        };
      }

      if (input.operation === "remove") {
        const normalizedEntries = input.entries.map((entry) => sanitizeMemoryEntry(entry));
        const nextEntries = sanitizeMemoryEntries(removeMemoryEntries(entries, normalizedEntries));
        const removed = entries.filter((entry) => !hasMemoryEntry(nextEntries, entry));
        const nextMemory = nextEntries;
        store.set(memoryAtom, nextMemory);

        return {
          action: "remove",
          removed,
          memory: nextMemory,
          summary: getMemorySummary(nextEntries),
        };
      }

      const oldEntry = sanitizeMemoryEntry(input.oldEntry);
      const newEntry = sanitizeMemoryEntry(input.newEntry);
      const withoutOld = removeMemoryEntries(entries, [oldEntry]);
      const replaced = withoutOld.length !== entries.length;
      const nextEntries = sanitizeMemoryEntries(
        newEntry && !hasMemoryEntry(withoutOld, newEntry) ? [...withoutOld, newEntry] : withoutOld,
      );
      const nextMemory = nextEntries;
      store.set(memoryAtom, nextMemory);

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
