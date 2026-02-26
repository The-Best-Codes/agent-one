import { createFireworks } from "@ai-sdk/fireworks";

export function getFireworks(apiKey: string, headers?: Record<string, string>) {
  return createFireworks({
    apiKey: apiKey || "unset",
    headers,
  });
}
