import {
  addTextToDB,
  initializeDB,
  removeTextFromDB,
  searchDB,
} from "@/utils/memory";
import { tool } from "ai";
import fs from "fs/promises";
import path from "path";
import { z } from "zod";

const MemoryOperationSchema = z.enum(["add", "remove", "query"]);

const MemoryTextSchema = z.object({
  add: z.string().nullable(),
  remove: z.string().nullable(),
  query: z.string().nullable(),
});

const MemoryToolSchema = z.object({
  operation: MemoryOperationSchema,
  text: MemoryTextSchema,
});

const HARDCODED_FILENAME = "db/agent_one_memory_db.json";
const HARDCODED_LOCK_FILENAME = "db/agent_one_memory_db.lock.json";

async function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  try {
    await fs.access(dirname);
  } catch (error: any) {
    try {
      await fs.mkdir(dirname, { recursive: true });
    } catch (error: any) {
      throw error; // Something else went wrong
    }
  }
}

export const memory = tool({
  description:
    "Use this tool to interact with your memory. You can add, remove, or query information.",
  parameters: MemoryToolSchema,
  execute: async ({
    operation,
    text,
  }: {
    operation: "add" | "remove" | "query";
    text: { add: string | null; remove: string | null; query: string | null };
  }) => {
    try {
      await ensureDirectoryExistence(HARDCODED_FILENAME);
      await ensureDirectoryExistence(HARDCODED_LOCK_FILENAME);
      await initializeDB(HARDCODED_FILENAME, HARDCODED_LOCK_FILENAME);

      switch (operation) {
        case "add":
          if (!text.add) {
            return { content: "Error: Text to add is required." };
          }
          await addTextToDB(text.add);
          return { content: "Text added to memory." };
        case "remove":
          if (!text.remove) {
            return { content: "Error: Text to remove is required." };
          }
          await removeTextFromDB(text.remove);
          return { content: "Text removed from memory." };
        case "query":
          if (!text.query) {
            return { content: "Error: Query text is required." };
          }
          const results = await searchDB(text.query);
          return { content: JSON.stringify(results) };
        default:
          return { content: "Error: Invalid operation." };
      }
    } catch (error: any) {
      console.error(`Memory operation failed:`, error);
      return {
        content: `Error: Memory operation failed: ${error.message}`,
      };
    }
  },
});
