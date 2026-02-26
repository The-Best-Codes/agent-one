import { createCohere } from "@ai-sdk/cohere";

export function getCohere(apiKey: string, headers?: Record<string, string>) {
  return createCohere({
    apiKey: apiKey || "unset",
    headers,
  });
}
