import { createOpenAICompatibleFactory } from "./openai-compatible";

const SERVER_URL = "https://www.agent-one.dev/api/openai-compat/v1";

export const getAgentOne = createOpenAICompatibleFactory("agent-one", SERVER_URL, undefined, {
  emptyApiKey: "not-authenticated",
});
