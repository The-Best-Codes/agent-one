import { createGoogleGenerativeAI } from "@ai-sdk/google";

export function getGoogle(apiKey: string, headers?: Record<string, string>) {
  return createGoogleGenerativeAI({
    apiKey: apiKey || "unset",
    headers,
  });
}
