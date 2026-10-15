import { tool, type UIMessage } from "ai";
import { z } from "zod";

import formatBytes from "@/lib/format-bytes";
import type { ReadChatToolConfig } from "@/lib/settings/types";
import { chatStorage } from "@/lib/storage/chat-storage";

export interface ChatToolsContext {
  currentChatId?: string;
}

function reduceTranscript(messages: UIMessage[]) {
  return JSON.stringify(
    messages.map((message) => ({
      ...message,
      parts: message.parts
        .filter((part) => part.type !== "reasoning")
        .map((part) => {
          if (part.type !== "file" || !part.url.startsWith("data:")) return part;
          const base64Length = part.url.length - part.url.indexOf(",") - 1;
          return {
            ...part,
            url: `[${formatBytes(Math.floor((base64Length * 3) / 4))} attachment omitted]`,
          };
        }),
    })),
  );
}

export const createReadChatTool = (config: ReadChatToolConfig, context: ChatToolsContext) => {
  const maxChars = Math.max(5000, Math.min(config.maxChars, 100000));
  const defaultChars = Math.max(1000, Math.min(config.defaultMaxChars, maxChars));

  return tool({
    description:
      "Read part of one of the user's past conversations with you, by chat ID (from the searchChats tool). The chat is turned into a JSON transcript of its messages (reasoning is left out and attachment data is replaced with a short description); this returns a range of that transcript starting at a character offset. Read in pieces and adjust start and length to look around the chat instead of reading it all at once. The conversation you are currently in is marked with isCurrent: true, and its latest messages may not be saved yet.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      chatId: z.string().min(1).describe("The ID of the chat to read."),
      start: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe("Character offset in the JSON transcript to start reading from."),
      length: z
        .number()
        .int()
        .min(1)
        .max(maxChars)
        .optional()
        .default(defaultChars)
        .describe(
          `Number of characters to read from the start offset. Defaults to ${defaultChars}, up to ${maxChars}.`,
        ),
    }),
    execute: async ({ chatId, start, length }) => {
      const [metadata, messages] = await Promise.all([
        chatStorage.getChatMetadata(chatId),
        chatStorage.getChatMessages(chatId),
      ]);

      if (!metadata && messages === null) {
        throw new Error(`No chat found with ID "${chatId}".`);
      }

      const fullTranscript = reduceTranscript(messages ?? []);
      const content = fullTranscript.slice(start, start + length);
      const end = start + content.length;

      return {
        chatId,
        title: metadata?.title,
        isCurrent: chatId === context.currentChatId,
        createdAt: metadata?.createdAt ? new Date(metadata.createdAt).toISOString() : undefined,
        lastMessageAt: metadata?.lastMessageAt
          ? new Date(metadata.lastMessageAt).toISOString()
          : undefined,
        messageCount: messages?.length ?? 0,
        transcriptChars: fullTranscript.length,
        start,
        end,
        hasMore: end < fullTranscript.length,
        content,
      };
    },
  });
};
