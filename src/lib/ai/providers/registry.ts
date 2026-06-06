import type { LanguageModel } from "ai";

import { getAihubmix } from "./factories/aihubmix";
import { getAnthropic } from "./factories/anthropic";
import { getCohere } from "./factories/cohere";
import { getDeepInfra } from "./factories/deepinfra";
import { getDeepSeek } from "./factories/deepseek";
import { getFireworks } from "./factories/fireworks";
import { getGoogle } from "./factories/google";
import { getGroq } from "./factories/groq";
import { getMistral } from "./factories/mistral";
import { getOpenAI } from "./factories/openai";
import { createOpenAICompatibleFactory } from "./factories/openai-compatible";
import { getOpenRouter } from "./factories/openrouter";
import { getPerplexity } from "./factories/perplexity";
import { getTogetherAI } from "./factories/togetherai";
import { getVenice } from "./factories/venice";
import { getVercel } from "./factories/vercel";
import { getXai } from "./factories/xai";

const get302AI = createOpenAICompatibleFactory("302ai", "https://api.302.ai/v1");
const getAgentOne = createOpenAICompatibleFactory(
  "agent-one",
  "https://www.agent-one.dev/api/openai-compat/v1",
  undefined,
  {
    emptyApiKey: "not-authenticated",
  },
);
const getAbacus = createOpenAICompatibleFactory("abacus", "https://routellm.abacus.ai/v1");
const getAbliterationAI = createOpenAICompatibleFactory(
  "abliteration-ai",
  "https://api.abliteration.ai/v1",
);
const getAlibabaCn = createOpenAICompatibleFactory(
  "alibaba-cn",
  "https://dashscope.aliyuncs.com/compatible-mode/v1",
);
const getAvian = createOpenAICompatibleFactory("avian", "https://api.avian.io/v1/");
const getBaseten = createOpenAICompatibleFactory("baseten", "https://inference.baseten.co/v1");
const getBerget = createOpenAICompatibleFactory("berget", "https://api.berget.ai/v1");
const getCerebras = createOpenAICompatibleFactory("cerebras", "https://api.cerebras.ai/v1", {
  "X-Cerebras-3rd-Party-Integration": "Vercel AI SDK",
});
const getChutes = createOpenAICompatibleFactory("chutes", "https://llm.chutes.ai/v1");
const getCortecs = createOpenAICompatibleFactory("cortecs", "https://api.cortecs.ai/v1");
const getFastRouter = createOpenAICompatibleFactory(
  "fastrouter",
  "https://go.fastrouter.ai/api/v1",
);
const getFriendli = createOpenAICompatibleFactory(
  "friendli",
  "https://api.friendli.ai/serverless/v1",
);
const getGitHubCopilot = createOpenAICompatibleFactory(
  "github-copilot",
  "https://api.githubcopilot.com",
);
const getGitHubModels = createOpenAICompatibleFactory(
  "github-models",
  "https://models.github.ai/inference",
);
const getHelicone = createOpenAICompatibleFactory("helicone", "https://ai-gateway.helicone.ai/v1");
const getHuggingFace = createOpenAICompatibleFactory(
  "huggingface",
  "https://router.huggingface.co/v1",
);
const getInception = createOpenAICompatibleFactory("inception", "https://api.inceptionlabs.ai/v1");
const getIoNet = createOpenAICompatibleFactory(
  "io-net",
  "https://api.intelligence.io.solutions/api/v1",
);
const getJiekou = createOpenAICompatibleFactory("jiekou", "https://api.jiekou.ai/openai");
const getKilo = createOpenAICompatibleFactory("kilo", "https://api.kilo.ai/api/gateway");
const getLlmGateway = createOpenAICompatibleFactory("llmgateway", "https://api.llmgateway.io/v1");
const getMoark = createOpenAICompatibleFactory("moark", "https://moark.com/v1");
const getModelScope = createOpenAICompatibleFactory(
  "modelscope",
  "https://api-inference.modelscope.cn/v1",
);
const getNanoGpt = createOpenAICompatibleFactory("nano-gpt", "https://nano-gpt.com/api/v1");
const getNovita = createOpenAICompatibleFactory("novita", "https://api.novita.ai/openai");
const getOpencodeZen = createOpenAICompatibleFactory("opencode-zen", "https://opencode.ai/zen/v1");
const getOvhcloud = createOpenAICompatibleFactory(
  "ovhcloud",
  "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
);
const getPoe = createOpenAICompatibleFactory("poe", "https://api.poe.com/v1");
const getRequesty = createOpenAICompatibleFactory("requesty", "https://router.requesty.ai/v1");
const getSynthetic = createOpenAICompatibleFactory(
  "synthetic",
  "https://api.synthetic.new/openai/v1",
);
const getTetrate = createOpenAICompatibleFactory("tetrate", "https://api.router.tetrate.ai/v1/");
const getWandb = createOpenAICompatibleFactory("wandb", "https://api.inference.wandb.ai/v1");
const getZenmux = createOpenAICompatibleFactory("zenmux", "https://zenmux.ai/api/v1");

export type ProviderFactory = (
  apiKey: string,
  headers?: Record<string, string>,
) => { languageModel: (modelId: string) => LanguageModel };

export interface ProviderDefinition {
  id: string;
  label: string;
  storageKey: string;
  envKey: string;
  factory: ProviderFactory;
  priority: number;
}

export const PROVIDER_REGISTRY = [
  {
    id: "agent-one",
    label: "AgentOne",
    storageKey: "AGENT_ONE_API_KEY",
    envKey: "AGENT_ONE_API_KEY",
    factory: getAgentOne as ProviderFactory,
    priority: 0,
  },
  {
    id: "302ai",
    label: "302.AI",
    storageKey: "302AI_API_KEY",
    envKey: "AGENT_ONE_302AI_API_KEY",
    factory: get302AI as ProviderFactory,
    priority: 1,
  },
  {
    id: "abacus",
    label: "Abacus",
    storageKey: "ABACUS_API_KEY",
    envKey: "AGENT_ONE_ABACUS_API_KEY",
    factory: getAbacus as ProviderFactory,
    priority: 2,
  },
  {
    id: "abliteration-ai",
    label: "Abliteration.ai",
    storageKey: "ABLIT_KEY",
    envKey: "AGENT_ONE_ABLIT_KEY",
    factory: getAbliterationAI as ProviderFactory,
    priority: 3,
  },
  {
    id: "aihubmix",
    label: "AIHubMix",
    storageKey: "AIHUBMIX_API_KEY",
    envKey: "AGENT_ONE_AIHUBMIX_API_KEY",
    factory: getAihubmix as ProviderFactory,
    priority: 4,
  },
  {
    id: "alibaba-cn",
    label: "Alibaba (China)",
    storageKey: "DASHSCOPE_API_KEY",
    envKey: "AGENT_ONE_DASHSCOPE_API_KEY",
    factory: getAlibabaCn as ProviderFactory,
    priority: 5,
  },
  {
    id: "anthropic",
    label: "Anthropic",
    storageKey: "ANTHROPIC_API_KEY",
    envKey: "AGENT_ONE_ANTHROPIC_API_KEY",
    factory: getAnthropic as ProviderFactory,
    priority: 6,
  },
  {
    id: "avian",
    label: "avian",
    storageKey: "AVIAN_API_KEY",
    envKey: "AGENT_ONE_AVIAN_API_KEY",
    factory: getAvian as ProviderFactory,
    priority: 7,
  },
  {
    id: "baseten",
    label: "Baseten",
    storageKey: "BASETEN_API_KEY",
    envKey: "AGENT_ONE_BASETEN_API_KEY",
    factory: getBaseten as ProviderFactory,
    priority: 8,
  },
  {
    id: "berget",
    label: "Berget.AI",
    storageKey: "BERGET_API_KEY",
    envKey: "AGENT_ONE_BERGET_API_KEY",
    factory: getBerget as ProviderFactory,
    priority: 9,
  },
  {
    id: "cerebras",
    label: "Cerebras",
    storageKey: "CEREBRAS_API_KEY",
    envKey: "AGENT_ONE_CEREBRAS_API_KEY",
    factory: getCerebras as ProviderFactory,
    priority: 10,
  },
  {
    id: "chutes",
    label: "Chutes",
    storageKey: "CHUTES_API_KEY",
    envKey: "AGENT_ONE_CHUTES_API_KEY",
    factory: getChutes as ProviderFactory,
    priority: 11,
  },
  {
    id: "cohere",
    label: "Cohere",
    storageKey: "COHERE_API_KEY",
    envKey: "AGENT_ONE_COHERE_API_KEY",
    factory: getCohere as ProviderFactory,
    priority: 12,
  },
  {
    id: "cortecs",
    label: "Cortecs",
    storageKey: "CORTECS_API_KEY",
    envKey: "AGENT_ONE_CORTECS_API_KEY",
    factory: getCortecs as ProviderFactory,
    priority: 13,
  },
  {
    id: "deepinfra",
    label: "DeepInfra",
    storageKey: "DEEPINFRA_API_KEY",
    envKey: "AGENT_ONE_DEEPINFRA_API_KEY",
    factory: getDeepInfra as ProviderFactory,
    priority: 14,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    storageKey: "DEEPSEEK_API_KEY",
    envKey: "AGENT_ONE_DEEPSEEK_API_KEY",
    factory: getDeepSeek as ProviderFactory,
    priority: 15,
  },
  {
    id: "fastrouter",
    label: "FastRouter",
    storageKey: "FASTROUTER_API_KEY",
    envKey: "AGENT_ONE_FASTROUTER_API_KEY",
    factory: getFastRouter as ProviderFactory,
    priority: 16,
  },
  {
    id: "fireworks-ai",
    label: "Fireworks AI",
    storageKey: "FIREWORKS_API_KEY",
    envKey: "AGENT_ONE_FIREWORKS_API_KEY",
    factory: getFireworks as ProviderFactory,
    priority: 17,
  },
  {
    id: "friendli",
    label: "Friendli",
    storageKey: "FRIENDLI_TOKEN",
    envKey: "AGENT_ONE_FRIENDLI_TOKEN",
    factory: getFriendli as ProviderFactory,
    priority: 18,
  },
  {
    id: "github-copilot",
    label: "GitHub Copilot",
    storageKey: "GITHUB_TOKEN",
    envKey: "AGENT_ONE_GITHUB_TOKEN",
    factory: getGitHubCopilot as ProviderFactory,
    priority: 19,
  },
  {
    id: "github-models",
    label: "GitHub Models",
    storageKey: "GITHUB_MODELS_TOKEN",
    envKey: "AGENT_ONE_GITHUB_MODELS_TOKEN",
    factory: getGitHubModels as ProviderFactory,
    priority: 20,
  },
  {
    id: "google",
    label: "Google Generative AI",
    storageKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    envKey: "AGENT_ONE_GOOGLE_GENERATIVE_AI_API_KEY",
    factory: getGoogle as ProviderFactory,
    priority: 21,
  },
  {
    id: "groq",
    label: "Groq",
    storageKey: "GROQ_API_KEY",
    envKey: "AGENT_ONE_GROQ_API_KEY",
    factory: getGroq as ProviderFactory,
    priority: 22,
  },
  {
    id: "helicone",
    label: "Helicone",
    storageKey: "HELICONE_API_KEY",
    envKey: "AGENT_ONE_HELICONE_API_KEY",
    factory: getHelicone as ProviderFactory,
    priority: 23,
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    storageKey: "HF_TOKEN",
    envKey: "AGENT_ONE_HF_TOKEN",
    factory: getHuggingFace as ProviderFactory,
    priority: 24,
  },
  {
    id: "inception",
    label: "Inception",
    storageKey: "INCEPTION_API_KEY",
    envKey: "AGENT_ONE_INCEPTION_API_KEY",
    factory: getInception as ProviderFactory,
    priority: 25,
  },
  {
    id: "io-net",
    label: "IO.NET",
    storageKey: "IOINTELLIGENCE_API_KEY",
    envKey: "AGENT_ONE_IOINTELLIGENCE_API_KEY",
    factory: getIoNet as ProviderFactory,
    priority: 26,
  },
  {
    id: "jiekou",
    label: "Jiekou.AI",
    storageKey: "JIEKOU_API_KEY",
    envKey: "AGENT_ONE_JIEKOU_API_KEY",
    factory: getJiekou as ProviderFactory,
    priority: 27,
  },
  {
    id: "kilo",
    label: "Kilo Gateway",
    storageKey: "KILO_API_KEY",
    envKey: "AGENT_ONE_KILO_API_KEY",
    factory: getKilo as ProviderFactory,
    priority: 28,
  },
  {
    id: "llmgateway",
    label: "LLM Gateway",
    storageKey: "LLMGATEWAY_API_KEY",
    envKey: "AGENT_ONE_LLMGATEWAY_API_KEY",
    factory: getLlmGateway as ProviderFactory,
    priority: 29,
  },
  {
    id: "mistral",
    label: "Mistral",
    storageKey: "MISTRAL_API_KEY",
    envKey: "AGENT_ONE_MISTRAL_API_KEY",
    factory: getMistral as ProviderFactory,
    priority: 30,
  },
  {
    id: "moark",
    label: "Moark",
    storageKey: "MOARK_API_KEY",
    envKey: "AGENT_ONE_MOARK_API_KEY",
    factory: getMoark as ProviderFactory,
    priority: 31,
  },
  {
    id: "modelscope",
    label: "ModelScope",
    storageKey: "MODELSCOPE_API_KEY",
    envKey: "AGENT_ONE_MODELSCOPE_API_KEY",
    factory: getModelScope as ProviderFactory,
    priority: 32,
  },
  {
    id: "nano-gpt",
    label: "NanoGPT",
    storageKey: "NANO_GPT_API_KEY",
    envKey: "AGENT_ONE_NANO_GPT_API_KEY",
    factory: getNanoGpt as ProviderFactory,
    priority: 33,
  },
  {
    id: "novita",
    label: "Novita",
    storageKey: "NOVITA_API_KEY",
    envKey: "AGENT_ONE_NOVITA_API_KEY",
    factory: getNovita as ProviderFactory,
    priority: 34,
  },
  {
    id: "openai",
    label: "OpenAI",
    storageKey: "OPENAI_API_KEY",
    envKey: "AGENT_ONE_OPENAI_API_KEY",
    factory: getOpenAI as ProviderFactory,
    priority: 35,
  },
  {
    id: "opencode-zen",
    label: "OpenCode Zen",
    storageKey: "OPENCODE_ZEN_API_KEY",
    envKey: "AGENT_ONE_OPENCODE_ZEN_API_KEY",
    factory: getOpencodeZen as ProviderFactory,
    priority: 36,
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    storageKey: "OPENROUTER_API_KEY",
    envKey: "AGENT_ONE_OPENROUTER_API_KEY",
    factory: getOpenRouter as ProviderFactory,
    priority: 37,
  },
  {
    id: "ovhcloud",
    label: "OVHcloud AI Endpoints",
    storageKey: "OVHCLOUD_API_KEY",
    envKey: "AGENT_ONE_OVHCLOUD_API_KEY",
    factory: getOvhcloud as ProviderFactory,
    priority: 38,
  },
  {
    id: "perplexity",
    label: "Perplexity",
    storageKey: "PERPLEXITY_API_KEY",
    envKey: "AGENT_ONE_PERPLEXITY_API_KEY",
    factory: getPerplexity as ProviderFactory,
    priority: 39,
  },
  {
    id: "poe",
    label: "Poe",
    storageKey: "POE_API_KEY",
    envKey: "AGENT_ONE_POE_API_KEY",
    factory: getPoe as ProviderFactory,
    priority: 40,
  },
  {
    id: "requesty",
    label: "Requesty",
    storageKey: "REQUESTY_API_KEY",
    envKey: "AGENT_ONE_REQUESTY_API_KEY",
    factory: getRequesty as ProviderFactory,
    priority: 41,
  },
  {
    id: "synthetic",
    label: "Synthetic",
    storageKey: "SYNTHETIC_API_KEY",
    envKey: "AGENT_ONE_SYNTHETIC_API_KEY",
    factory: getSynthetic as ProviderFactory,
    priority: 42,
  },
  {
    id: "tetrate",
    label: "Tetrate Agent Router Service",
    storageKey: "TARS_API_KEY",
    envKey: "AGENT_ONE_TARS_API_KEY",
    factory: getTetrate as ProviderFactory,
    priority: 43,
  },
  {
    id: "togetherai",
    label: "Together AI",
    storageKey: "TOGETHERAI_API_KEY",
    envKey: "AGENT_ONE_TOGETHERAI_API_KEY",
    factory: getTogetherAI as ProviderFactory,
    priority: 44,
  },
  {
    id: "venice",
    label: "Venice AI",
    storageKey: "VENICE_API_KEY",
    envKey: "AGENT_ONE_VENICE_API_KEY",
    factory: getVenice as ProviderFactory,
    priority: 45,
  },
  {
    id: "vercel",
    label: "Vercel AI Gateway",
    storageKey: "AI_GATEWAY_API_KEY",
    envKey: "AGENT_ONE_AI_GATEWAY_API_KEY",
    factory: getVercel as ProviderFactory,
    priority: 46,
  },
  {
    id: "wandb",
    label: "Weights & Biases",
    storageKey: "WANDB_API_KEY",
    envKey: "AGENT_ONE_WANDB_API_KEY",
    factory: getWandb as ProviderFactory,
    priority: 47,
  },
  {
    id: "xai",
    label: "xAI",
    storageKey: "XAI_API_KEY",
    envKey: "AGENT_ONE_XAI_API_KEY",
    factory: getXai as ProviderFactory,
    priority: 48,
  },
  {
    id: "zenmux",
    label: "ZenMux",
    storageKey: "ZENMUX_API_KEY",
    envKey: "AGENT_ONE_ZENMUX_API_KEY",
    factory: getZenmux as ProviderFactory,
    priority: 49,
  },
] as const satisfies readonly ProviderDefinition[];

export type ProviderId = (typeof PROVIDER_REGISTRY)[number]["id"];
export type ProviderStorageKey = (typeof PROVIDER_REGISTRY)[number]["storageKey"];

export const PROVIDER_IDS = PROVIDER_REGISTRY.map((provider) => provider.id);

const providersById = new Map(PROVIDER_REGISTRY.map((provider) => [provider.id, provider]));
const providersByStorageKey = new Map(
  PROVIDER_REGISTRY.map((provider) => [provider.storageKey, provider]),
);

export function getProviderById(id: ProviderId): ProviderDefinition {
  const provider = providersById.get(id);
  if (!provider) {
    throw new Error(`Unknown provider: ${id}`);
  }

  return provider;
}

export function getProviderByStorageKey(key: ProviderStorageKey): ProviderDefinition {
  const provider = providersByStorageKey.get(key);
  if (!provider) {
    throw new Error(`Unknown storage key: ${key}`);
  }

  return provider;
}

export function getEnvApiKey(providerId: ProviderId): string | undefined {
  return import.meta.env[getProviderById(providerId).envKey] as string | undefined;
}

export function getEffectiveApiKey(providerId: ProviderId, storedKey: string): string {
  return storedKey || getEnvApiKey(providerId) || "";
}

export function hasApiKey(providerId: ProviderId, storedKey: string): boolean {
  return Boolean(storedKey || getEnvApiKey(providerId));
}

export function hasEnvKey(providerId: ProviderId): boolean {
  return Boolean(getEnvApiKey(providerId));
}
