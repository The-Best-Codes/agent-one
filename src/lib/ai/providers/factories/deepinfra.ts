import { createDeepInfra } from "@ai-sdk/deepinfra";

export function getDeepInfra(apiKey: string, headers?: Record<string, string>) {
  return createDeepInfra({
    apiKey: apiKey || "unset",
    headers,
  });
}
