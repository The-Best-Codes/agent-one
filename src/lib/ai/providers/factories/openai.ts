import { createOpenAI } from "@ai-sdk/openai";

export function getOpenAI(apiKey: string, headers?: Record<string, string>) {
  return createOpenAI({
    apiKey: apiKey || "unset",
    headers,
  });
}
