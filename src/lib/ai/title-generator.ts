import type { LanguageModel, TextPart, UIMessage } from "ai";
import { generateText } from "ai";

import { getLogger } from "@/lib/logger";

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

export async function generateChatTitle(
  model: LanguageModel,
  messages: UIMessage[],
  maxTokens?: number | "none",
): Promise<string> {
  logger.verbose(`Generating title for chat with ${messages.length} messages`);
  try {
    const relevantMessages = messages.slice(0, 2);

    if (relevantMessages.length === 0) {
      return "New chat";
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
      return "New chat";
    }
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    logger.error("Failed to generate chat title:", error);
    return "New chat";
  }
}
