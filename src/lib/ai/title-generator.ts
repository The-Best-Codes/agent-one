import type { LanguageModel, TextPart, UIMessage } from "ai";
import { generateText } from "ai";

import { getLogger } from "@/lib/logger";
import type { TitleGenerationSettings } from "@/lib/settings/types";

const logger = getLogger(import.meta.url);

function calculateMaxOutputTokens(
  maxTokens?: number | "none",
): number | undefined {
  if (maxTokens === "none") {
    return undefined;
  }
  if (typeof maxTokens === "number") {
    return maxTokens;
  }
  return 20;
}

function extractTextFromMessage(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as TextPart).text)
    .join(" ")
    .trim();
}

export function hasMessageTextContent(message: UIMessage): boolean {
  return extractTextFromMessage(message).length > 0;
}

function extractMessageText(
  messages: UIMessage[],
  role: "user" | "assistant",
): string {
  const message = messages.find((m) => m.role === role);
  if (!message) return "";
  return extractTextFromMessage(message);
}

function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.substring(0, limit - 3) + "...";
}

export async function generateChatTitleAI(
  model: LanguageModel,
  messages: UIMessage[],
  fallbackPhrase: string,
  maxTokens?: number | "none",
): Promise<string> {
  logger.verbose(
    `Generating AI title for chat with ${messages.length} messages`,
  );
  try {
    const relevantMessages = messages.slice(0, 2);

    if (relevantMessages.length === 0) {
      return fallbackPhrase;
    }

    const conversationText = relevantMessages
      .map((msg) => {
        const textParts = msg.parts
          .filter((part) => part.type === "text")
          .map((part) => (part as TextPart).text)
          .join(" ");
        return `${msg.role}: ${textParts}`;
      })
      .join("\n")
      .slice(0, 1000);

    const result = await generateText({
      model,
      prompt: `Based on this conversation, generate a concise, descriptive title (max 6 words, no quotes):

${conversationText}

Title:`,
      maxOutputTokens: calculateMaxOutputTokens(maxTokens),
    });

    const title = result.text.trim().replace(/^["']|["']$/g, "");
    if (!title) {
      return fallbackPhrase;
    }
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    logger.error("Failed to generate chat title:", error);
    return fallbackPhrase;
  }
}

export function generateChatTitleFromSettings(
  messages: UIMessage[],
  settings: TitleGenerationSettings,
): string | null {
  const { method, characterLimit, customPhrase, fallbackPhrase } = settings;

  switch (method) {
    case "first-user-message": {
      const text = extractMessageText(messages, "user");
      if (!text) return fallbackPhrase;
      return truncateText(text, characterLimit);
    }
    case "first-assistant-message": {
      const text = extractMessageText(messages, "assistant");
      if (!text) return null;
      return truncateText(text, characterLimit);
    }
    case "custom":
      return customPhrase || fallbackPhrase;
    case "ai":
    default:
      return null;
  }
}

export async function generateChatTitle(
  model: LanguageModel,
  messages: UIMessage[],
  settings: TitleGenerationSettings,
  maxTokens?: number | "none",
): Promise<string> {
  const syncTitle = generateChatTitleFromSettings(messages, settings);
  if (syncTitle !== null) {
    return syncTitle;
  }

  return generateChatTitleAI(
    model,
    messages,
    settings.fallbackPhrase,
    maxTokens,
  );
}
