import { createAihubmix } from "@aihubmix/ai-sdk-provider";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export function getAihubmix(apiKey: string) {
  return createAihubmix({
    apiKey: apiKey || "unset",
    fetch: tauriFetch,
  });
}
