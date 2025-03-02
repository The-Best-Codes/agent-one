import { tool } from "ai";
import { z } from "zod";

const SERVER_URL =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_DEPLOYMENT_URL
    : process.env.LOCAL_DEPLOYMENT_URL;
const BASE_URL = `${SERVER_URL}/api/memory`;

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
    let endpoint = "";
    let requestBody = {};

    switch (operation) {
      case "add":
        endpoint = `${BASE_URL}/save`;
        if (!text.add) {
          return { content: "Error: Text to add is required." };
        }
        requestBody = { text: text.add };
        break;
      case "remove":
        endpoint = `${BASE_URL}/remove`;
        if (!text.remove) {
          return { content: "Error: Text to remove is required." };
        }
        requestBody = { text: text.remove };
        break;
      case "query":
        endpoint = `${BASE_URL}/query`;
        if (!text.query) {
          return { content: "Error: Query text is required." };
        }
        requestBody = { query: text.query };
        break;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Memory ${operation} failed:`, errorData);
        return {
          content: `Error: Memory ${operation} failed: ${
            errorData.message || "Unknown error"
          }`,
        };
      }

      const data = await response.json();
      return { content: JSON.stringify(data) };
    } catch (error: any) {
      console.error(`Error during memory ${operation}:`, error);
      return {
        content: `Error: Memory ${operation} request failed: ${error.message}`,
      };
    }
  },
});
