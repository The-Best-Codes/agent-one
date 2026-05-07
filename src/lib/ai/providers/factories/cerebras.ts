import { createOpenAICompatibleFactory } from "./openai-compatible";

export const getCerebras = createOpenAICompatibleFactory("cerebras", "https://api.cerebras.ai/v1", {
  "X-Cerebras-3rd-Party-Integration": "Vercel AI SDK",
});
