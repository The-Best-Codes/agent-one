import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function createGoogle(apiKey?: string) {
  return createGoogleGenerativeAI({
    apiKey: apiKey || import.meta.env.AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY,
  });
}
