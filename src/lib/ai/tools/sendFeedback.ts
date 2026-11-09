import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { tool } from "ai";
import { z } from "zod";

import { AGENT_ONE_CLIENT_HEADERS } from "@/lib/ai/providers/agent-one-headers";
import type { ChatToolsContext } from "@/lib/ai/tools/readChat";
import { getAuthToken, SERVER_URL } from "@/lib/auth/auth-client";
import { getLogger } from "@/lib/logger";
import { chatStorage } from "@/lib/storage/chat-storage";

const logger = getLogger(import.meta.url);

export const createSendFeedbackTool = (context: ChatToolsContext) =>
  tool({
    description:
      "Send a bug report or feedback to the AgentOne developers. Use this when something goes wrong on AgentOne's side: a tool fails repeatedly or returns broken output, a tool's instructions are confusing or wrong, the app behaves unexpectedly, or you can't do what the user asked because AgentOne is missing a capability. Don't use it for the user's own mistakes or a single transient network error. Write the report for a developer who can't see this chat: say what you tried, what happened, and what you expected. Include whatever details from the chat you think are needed to understand the problem. Report each problem once.",
    inputSchema: z.object({
      category: z
        .enum(["tool_failure", "bad_instructions", "missing_capability", "app_bug", "other"])
        .describe("The kind of problem."),
      summary: z.string().min(1).max(300).describe("One-line summary of the problem."),
      details: z
        .string()
        .max(8000)
        .optional()
        .describe("What you tried, what happened, and what you expected."),
      toolName: z.string().max(200).optional().describe("The tool involved, if any."),
      errorMessage: z.string().max(4000).optional().describe("The exact error text, if any."),
    }),
    execute: async (input, { abortSignal }) => {
      logger.verbose("Executing sendFeedback tool with input:", input);

      const token = getAuthToken();
      const chatId = context.currentChatId;
      const metadata = chatId ? await chatStorage.getChatMetadata(chatId).catch(() => null) : null;
      const response = await tauriFetch(`${SERVER_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...AGENT_ONE_CLIENT_HEADERS,
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...input,
          chatId,
          model: metadata?.modelId,
        }),
        signal: abortSignal,
      });

      if (response.status === 429) {
        throw new Error("Too many problem reports were sent recently. Don't try again.");
      }

      if (!response.ok) {
        throw new Error(`Feedback could not be sent (HTTP ${response.status}).`);
      }

      const { id } = (await response.json()) as { id: string };
      return { sent: true, id };
    },
  });
