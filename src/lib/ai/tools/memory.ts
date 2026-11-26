import { tool } from "ai";
import { getDefaultStore } from "jotai";
import { z } from "zod";

import type { ChatToolsContext } from "@/lib/ai/tools/readChat";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import {
  MAX_MEMORY_ENTRIES,
  MAX_MEMORY_ENTRY_CHARS,
  hasMemoryEntry,
  removeMemoryEntries,
  sanitizeMemoryEntries,
  sanitizeMemoryEntry,
} from "@/lib/memory";
import { getProject, updateProject } from "@/lib/projects";

const logger = getLogger(import.meta.url);

const memoryOperationSchema = z.object({
  operation: z.enum(["add", "remove", "replace"]),
  entries: z
    .array(z.string().min(1))
    .max(20)
    .optional()
    .describe("Entries to add or remove. Used by the add and remove operations."),
  oldEntry: z.string().optional().describe("The existing entry to replace. Used by replace."),
  newEntry: z
    .string()
    .optional()
    .describe("The new entry text. Used only by replace; add takes its entries in `entries`."),
});

function assertEntriesFit(values: (string | undefined)[]) {
  const tooLong = values.filter(
    (value): value is string =>
      !!value && value.replace(/\s+/g, " ").trim().length > MAX_MEMORY_ENTRY_CHARS,
  );
  if (tooLong.length === 0) return;
  throw new Error(
    `Memory entries can be at most ${MAX_MEMORY_ENTRY_CHARS} characters. Nothing was saved. Shorten or split these entries:\n${tooLong
      .map((value) => `- ${value.slice(0, 80)}… (${value.length} characters)`)
      .join("\n")}`,
  );
}

function collectEntries(entries: string[] | undefined, single: string | undefined) {
  return [...(entries ?? []), ...(single ? [single] : [])]
    .map((entry) => sanitizeMemoryEntry(entry))
    .filter(Boolean);
}

function getMemorySummary(entries: string[]) {
  return entries.length === 0
    ? "Memory is empty."
    : `${entries.length} of ${MAX_MEMORY_ENTRIES} memory entr${entries.length === 1 ? "y" : "ies"} used.`;
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

export const createMemoryTool = (context: ChatToolsContext) =>
  tool({
    description:
      "Store long-term memory. Use this to add, remove, or replace concise memory entries that you can reference in later conversations. Keep entries short, stable, non-duplicative, and free of contradictions.",
    inputSchema: memoryOperationSchema,
    execute: async (input) => {
      logger.verbose("Executing memory tool with input:", input);

      const memoryStore = getMemoryStore(context);
      let entries = sanitizeMemoryEntries(memoryStore.get());

      if (input.operation === "add") {
        if (input.newEntry) {
          throw new Error(
            "add doesn't take `newEntry`. Nothing was saved. Pass each new entry as a separate string in the `entries` array.",
          );
        }
        assertEntriesFit(input.entries ?? []);
        const toAdd = collectEntries(input.entries, undefined);
        if (toAdd.length === 0) {
          throw new Error("No entries to add. Pass the new entries in the `entries` array.");
        }

        const added: string[] = [];
        const skipped: { entry: string; reason: string }[] = [];

        for (const entry of toAdd) {
          if (hasMemoryEntry(entries, entry)) {
            skipped.push({ entry, reason: "already in memory" });
          } else if (entries.length >= MAX_MEMORY_ENTRIES) {
            skipped.push({ entry, reason: `memory is full (${MAX_MEMORY_ENTRIES} entries)` });
          } else {
            entries = [...entries, entry];
            added.push(entry);
          }
        }

        const nextMemory = entries;
        memoryStore.set(nextMemory);

        return {
          action: "add",
          added,
          ...(skipped.length > 0 && { skipped }),
          memory: nextMemory,
          summary: getMemorySummary(entries),
        };
      }

      if (input.operation === "remove") {
        const normalizedEntries = collectEntries(input.entries, input.oldEntry);
        if (normalizedEntries.length === 0) {
          throw new Error("No entries to remove. Pass the entries in the `entries` array.");
        }
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
      if (!oldEntry || !newEntry) {
        throw new Error(
          "replace needs both `oldEntry` (the exact existing entry) and `newEntry` (its new text). Nothing was changed.",
        );
      }
      assertEntriesFit([input.newEntry]);
      const withoutOld = removeMemoryEntries(entries, [oldEntry]);
      const replaced = withoutOld.length !== entries.length;
      if (!replaced) {
        throw new Error(
          "`oldEntry` doesn't match any memory entry, so nothing was changed. Use the exact text of the entry you want to replace.",
        );
      }
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
