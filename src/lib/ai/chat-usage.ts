import type { LanguageModelUsage, UIMessage } from "ai";

import { modelDirectoryData, type ModelRecord } from "@/assets/model-lists/model-directory";
import { PROVIDER_IDS } from "@/lib/ai/providers/registry";

const TOKENS_PER_MILLION = 1_000_000;

export interface ChatUsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalCostUsd: number;
}

export interface MessageTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  inputTokenDetails?: {
    noCacheTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  outputTokenDetails?: {
    textTokens?: number;
    reasoningTokens?: number;
  };
  reasoningTokens?: number;
  cachedInputTokens?: number;
}

export interface ChatMessageMetadata {
  modelId?: string;
  usage?: MessageTokenUsage;
  totalUsage?: MessageTokenUsage;
}

function createEmptyUsage(): Required<
  Pick<
    ChatUsageSummary,
    | "inputTokens"
    | "outputTokens"
    | "totalTokens"
    | "cacheReadTokens"
    | "cacheWriteTokens"
    | "reasoningTokens"
  >
> {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
  };
}

export function createEmptyMessageTokenUsage(): MessageTokenUsage {
  return {
    inputTokens: undefined,
    outputTokens: undefined,
    totalTokens: undefined,
    inputTokenDetails: {
      noCacheTokens: undefined,
      cacheReadTokens: undefined,
      cacheWriteTokens: undefined,
    },
    outputTokenDetails: {
      textTokens: undefined,
      reasoningTokens: undefined,
    },
    reasoningTokens: undefined,
    cachedInputTokens: undefined,
  };
}

function sanitizeNumber(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function getModelCostByChatModelId(
  chatModelId: string | undefined,
): ModelRecord["pricing"] | undefined {
  if (!chatModelId) return undefined;

  const providerId = PROVIDER_IDS.find((id) => chatModelId.startsWith(`${id}-`));
  if (!providerId) return undefined;
  const modelId = chatModelId.slice(providerId.length + 1);

  return modelDirectoryData[providerId]?.models[modelId]?.pricing;
}

export function normalizeUsage(usage: MessageTokenUsage | LanguageModelUsage | undefined) {
  const reasoningTokens = sanitizeNumber(
    usage?.outputTokenDetails?.reasoningTokens ?? usage?.reasoningTokens,
  );
  const cacheReadTokens = sanitizeNumber(
    usage?.inputTokenDetails?.cacheReadTokens ?? usage?.cachedInputTokens,
  );
  const cacheWriteTokens = sanitizeNumber(usage?.inputTokenDetails?.cacheWriteTokens);
  const inputTokens = sanitizeNumber(usage?.inputTokens);
  const outputTokens = sanitizeNumber(usage?.outputTokens);
  const totalTokens = sanitizeNumber(usage?.totalTokens ?? inputTokens + outputTokens);
  const noCacheInputTokens = sanitizeNumber(usage?.inputTokenDetails?.noCacheTokens);
  const textTokens = sanitizeNumber(usage?.outputTokenDetails?.textTokens);

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    reasoningTokens,
    cacheReadTokens,
    cacheWriteTokens,
    noCacheInputTokens,
    textTokens,
  };
}

export function addMessageTokenUsage(
  usage1: MessageTokenUsage | undefined,
  usage2: MessageTokenUsage | LanguageModelUsage | undefined,
): MessageTokenUsage {
  const normalized1 = normalizeUsage(usage1);
  const normalized2 = normalizeUsage(usage2);

  return {
    inputTokens: normalized1.inputTokens + normalized2.inputTokens,
    outputTokens: normalized1.outputTokens + normalized2.outputTokens,
    totalTokens: normalized1.totalTokens + normalized2.totalTokens,
    inputTokenDetails: {
      noCacheTokens: normalized1.noCacheInputTokens + normalized2.noCacheInputTokens,
      cacheReadTokens: normalized1.cacheReadTokens + normalized2.cacheReadTokens,
      cacheWriteTokens: normalized1.cacheWriteTokens + normalized2.cacheWriteTokens,
    },
    outputTokenDetails: {
      textTokens: normalized1.textTokens + normalized2.textTokens,
      reasoningTokens: normalized1.reasoningTokens + normalized2.reasoningTokens,
    },
    reasoningTokens: normalized1.reasoningTokens + normalized2.reasoningTokens,
    cachedInputTokens: normalized1.cacheReadTokens + normalized2.cacheReadTokens,
  };
}

export function calculateCostUsdFromUsage(
  usage: MessageTokenUsage | LanguageModelUsage | undefined,
  modelCost: ModelRecord["pricing"] | undefined,
): number {
  if (!modelCost || !usage) return 0;

  const normalized = normalizeUsage(usage);
  const billableInputTokens =
    usage.inputTokenDetails?.noCacheTokens != null
      ? normalized.noCacheInputTokens
      : normalized.inputTokens;
  const billableOutputTokens =
    usage.outputTokenDetails?.textTokens != null
      ? normalized.textTokens
      : Math.max(0, normalized.outputTokens - normalized.reasoningTokens);

  const inputCost = (billableInputTokens * (modelCost.input ?? 0)) / TOKENS_PER_MILLION;
  const cacheReadCost =
    (normalized.cacheReadTokens * (modelCost.cache_read ?? 0)) / TOKENS_PER_MILLION;
  const cacheWriteCost =
    (normalized.cacheWriteTokens * (modelCost.cache_write ?? 0)) / TOKENS_PER_MILLION;
  const outputCost = (billableOutputTokens * (modelCost.output ?? 0)) / TOKENS_PER_MILLION;
  const reasoningCost =
    (normalized.reasoningTokens * (modelCost.reasoning ?? modelCost.output ?? 0)) /
    TOKENS_PER_MILLION;

  return inputCost + cacheReadCost + cacheWriteCost + outputCost + reasoningCost;
}

export function summarizeUsage(usage: MessageTokenUsage | undefined) {
  const normalized = normalizeUsage(usage);
  return {
    inputTokens: normalized.inputTokens,
    outputTokens: normalized.outputTokens,
    totalTokens: normalized.totalTokens,
    cacheReadTokens: normalized.cacheReadTokens,
    cacheWriteTokens: normalized.cacheWriteTokens,
    reasoningTokens: normalized.reasoningTokens,
  };
}

export function getLastAssistantUsage(messages: UIMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "assistant") continue;

    const metadata = message.metadata as ChatMessageMetadata | undefined;
    if (!metadata || typeof metadata !== "object") continue;
    if (!metadata.usage) continue;

    return summarizeUsage(metadata.usage);
  }

  return createEmptyUsage();
}

export function calculateMessageCostFromMetadata(
  metadata: ChatMessageMetadata | undefined,
): number {
  if (!metadata?.modelId) return 0;
  return calculateCostUsdFromUsage(
    metadata.totalUsage,
    getModelCostByChatModelId(metadata.modelId),
  );
}

export function calculateChatUsageFromMessages(messages: UIMessage[]): ChatUsageSummary {
  let inputTokens = 0;
  let outputTokens = 0;
  let totalTokens = 0;
  let cacheReadTokens = 0;
  let cacheWriteTokens = 0;
  let reasoningTokens = 0;
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
    const usageSummary = summarizeUsage(usageMetadata.usage);

    inputTokens += usageSummary.inputTokens;
    outputTokens += usageSummary.outputTokens;
    totalTokens += usageSummary.totalTokens;
    cacheReadTokens += usageSummary.cacheReadTokens;
    cacheWriteTokens += usageSummary.cacheWriteTokens;
    reasoningTokens += usageSummary.reasoningTokens;
    totalCostUsd += calculateMessageCostFromMetadata(usageMetadata);
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cacheReadTokens,
    cacheWriteTokens,
    reasoningTokens,
    totalCostUsd,
  };
}
