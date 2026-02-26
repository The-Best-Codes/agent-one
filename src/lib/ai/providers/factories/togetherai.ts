import { createTogetherAI } from "@ai-sdk/togetherai";

export function getTogetherAI(
  apiKey: string,
  headers?: Record<string, string>,
) {
  return createTogetherAI({
    apiKey: apiKey || "unset",
    headers,
  });
}
