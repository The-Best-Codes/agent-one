import { createXai } from "@ai-sdk/xai";

export function getXai(apiKey: string, headers?: Record<string, string>) {
  return createXai({
    apiKey: apiKey || "unset",
    headers,
  });
}
