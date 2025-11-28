import { createGroq } from "@ai-sdk/groq";

export function createGroqProvider(apiKey?: string) {
  return createGroq({
    apiKey: apiKey || import.meta.env.AGENT_ONE_GROQ_API_KEY,
  });
}
