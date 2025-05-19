"use server";
import { namePrompt } from "@/lib/chat-name-prompt";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export default async function generateTitle(message: string): Promise<string> {
  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    system: namePrompt,
    prompt: `\`\`\`user\n${message}\n\`\`\``,
    maxTokens: 100,
  });

  return text;
}
