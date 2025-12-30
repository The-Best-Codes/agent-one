import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function getGoogle(apiKey: string) {
  return createGoogleGenerativeAI({
    apiKey,
  });
}
