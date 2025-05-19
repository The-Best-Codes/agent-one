"use server";
import { namePrompt } from "@/lib/chat-name-prompt";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export default async function generateTitle(message: string): Promise<string> {
  try {
    console.log(
      "Generating title with message:",
      message.substring(0, 50) + "...",
    );

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system: namePrompt,
      prompt: `\`\`\`user\n${message}\n\`\`\``,
      maxTokens: 100,
    });

    if (!text || text.trim().length === 0) {
      console.warn("Generated title was empty, using fallback");
      return "New Chat";
    }

    return text;
  } catch (error) {
    console.error("Error generating title:", error);
    return "New Chat"; // Fallback in case of errors
  }
}
