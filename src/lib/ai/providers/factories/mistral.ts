import { createMistral } from "@ai-sdk/mistral";

export function getMistral(apiKey: string, headers?: Record<string, string>) {
  return createMistral({
    apiKey: apiKey || "unset",
    headers,
  });
}
