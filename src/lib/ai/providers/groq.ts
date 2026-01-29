import { createGroq } from "@ai-sdk/groq";

export function getGroq(apiKey: string, headers?: Record<string, string>) {
  return createGroq({
    apiKey: apiKey || "unset",
    headers,
  });
}
