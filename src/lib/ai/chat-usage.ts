import type { UIMessage } from "ai";

import {
  type ModelsDevData,
  modelsDevData,
  type ModelsDevModel,
} from "@/assets/model-lists/models-dev";
import { PROVIDER_IDS } from "@/lib/ai/providers/registry";

const TOKENS_PER_MILLION = 1_000_000;
const typedModelsDevData = modelsDevData as unknown as ModelsDevData;

export interface ChatUsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalCostUsd: number;
}

export interface ChatMessageMetadata {
  modelId?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalCostUsd?: number;
}

type UsageLike = {
  inputTokens?: number;
  outputTokens?: number;
  inputTokenDetails?: {
    noCacheTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  outputTokenDetails?: {
    textTokens?: number;
    reasoningTokens?: number;
  };
};

export function getModelCostByChatModelId(
  chatModelId: string | undefined,
): ModelsDevModel["cost"] | undefined {
  if (!chatModelId) return undefined;

  const providerId = PROVIDER_IDS.find((id) => chatModelId.startsWith(`${id}-`));
  if (!providerId) return undefined;
  const modelId = chatModelId.slice(providerId.length + 1);

  return typedModelsDevData[providerId]?.models[modelId]?.cost;
}

export function calculateCostUsdFromUsage(
  usage: UsageLike,
  modelCost: ModelsDevModel["cost"] | undefined,
): number {
  if (!modelCost) return 0;

  const noCacheInputTokens = usage.inputTokenDetails?.noCacheTokens;
  const inputTokens = noCacheInputTokens ?? usage.inputTokens ?? 0;
  const cacheReadTokens = usage.inputTokenDetails?.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage.inputTokenDetails?.cacheWriteTokens ?? 0;

  const reasoningTokens = usage.outputTokenDetails?.reasoningTokens ?? 0;
  const textTokens = usage.outputTokenDetails?.textTokens;
  const fallbackOutputTokens = usage.outputTokens ?? 0;
  const nonReasoningOutputTokens =
    textTokens ?? Math.max(0, fallbackOutputTokens - reasoningTokens);

  const inputCost = (inputTokens * (modelCost.input ?? 0)) / TOKENS_PER_MILLION;
  const cacheReadCost = (cacheReadTokens * (modelCost.cache_read ?? 0)) / TOKENS_PER_MILLION;
  const cacheWriteCost = (cacheWriteTokens * (modelCost.cache_write ?? 0)) / TOKENS_PER_MILLION;
  const outputCost = (nonReasoningOutputTokens * (modelCost.output ?? 0)) / TOKENS_PER_MILLION;
  const reasoningCost =
    (reasoningTokens * (modelCost.reasoning ?? modelCost.output ?? 0)) / TOKENS_PER_MILLION;

  return inputCost + cacheReadCost + cacheWriteCost + outputCost + reasoningCost;
}

export function calculateChatUsageFromMessages(messages: UIMessage[]): ChatUsageSummary {
  let inputTokens = 0;
  let outputTokens = 0;
  let totalCostUsd = 0;

  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }

    const metadata = message.metadata;
    if (!metadata || typeof metadata !== "object") {
      continue;
    }

    const usageMetadata = metadata as ChatMessageMetadata;
    if (typeof usageMetadata.inputTokens === "number") {
      inputTokens += usageMetadata.inputTokens;
    }
    if (typeof usageMetadata.outputTokens === "number") {
      outputTokens += usageMetadata.outputTokens;
    }
    if (typeof usageMetadata.totalCostUsd === "number") {
      totalCostUsd += usageMetadata.totalCostUsd;
    }
  }

  return {
    inputTokens,
    outputTokens,
    totalCostUsd,
  };
}
