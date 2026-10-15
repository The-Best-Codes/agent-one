import { tool } from "ai";
import { z } from "zod";

import type { ChatToolsContext } from "@/lib/ai/tools/readChat";
import type { SearchChatsToolConfig } from "@/lib/settings/types";
import { chatStorage } from "@/lib/storage/chat-storage";

export const createSearchChatsTool = (config: SearchChatsToolConfig, context: ChatToolsContext) =>
  tool({
    description:
      "Search the user's past conversations with you by keyword, or list the most recent conversations when no query is given. Each result includes the chat's ID and how many messages it has (messageCount). The conversation you are currently in is marked with isCurrent: true.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe("Keywords to search for. Leave empty to list the most recent conversations."),
      rawSyntax: z
        .boolean()
        .optional()
        .describe(
          'Treat the query as raw SQLite FTS5 syntax (e.g. AND, OR, NOT, NEAR, "exact phrases", prefix*). By default each word is matched as a prefix and all words must appear.',
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe(`Maximum number of results. Defaults to ${config.defaultMaxResults}.`),
    }),
    execute: async ({ query, rawSyntax, limit }) => {
      const maxResults = limit ?? config.defaultMaxResults;
      const trimmedQuery = query?.trim();

      if (!trimmedQuery) {
        const chats = (await chatStorage.listChats("updated-at")).slice(0, maxResults);
        const messageCounts = await chatStorage.getChatMessageCounts(chats.map((chat) => chat.id));
        return {
          results: chats.map((chat) => ({
            chatId: chat.id,
            title: chat.metadata.title,
            lastMessageAt: chat.metadata.lastMessageAt
              ? new Date(chat.metadata.lastMessageAt).toISOString()
              : undefined,
            messageCount: messageCounts.get(chat.id) ?? 0,
            isCurrent: chat.id === context.currentChatId,
          })),
        };
      }

      const results = (await chatStorage.searchChats(trimmedQuery, rawSyntax)).slice(0, maxResults);
      const messageCounts = await chatStorage.getChatMessageCounts(
        results.map((result) => result.chatId),
      );
      return {
        results: results.map((result) => ({
          chatId: result.chatId,
          title: result.title,
          snippet: result.snippet.replace(/<\/?mark>/g, ""),
          messageCount: messageCounts.get(result.chatId) ?? 0,
          isCurrent: result.chatId === context.currentChatId,
        })),
      };
    },
  });
