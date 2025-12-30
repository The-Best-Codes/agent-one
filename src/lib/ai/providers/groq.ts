import { createGroq } from "@ai-sdk/groq";

export function getGroq(apiKey: string) {
  return createGroq({
    apiKey,
  });
}
