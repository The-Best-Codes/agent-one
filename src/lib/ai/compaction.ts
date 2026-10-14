import {
  generateText,
  type LanguageModel,
  type LanguageModelUsage,
  type ModelMessage,
  pruneMessages,
  type UIMessage,
  type UIMessageChunk,
  type UserModelMessage,
} from "ai";

import type { ModelConfig } from "@/hooks/ai/use-model-catalog";
import type { ChatMessageMetadata, MessageTokenUsage } from "@/lib/ai/chat-usage";

export const COMPACTION_PART_TYPE = "data-compaction";
export const DEFAULT_COMPACTION_THRESHOLD = 95;
export const MIN_COMPACTION_THRESHOLD = 5;
export const MAX_COMPACTION_THRESHOLD = 95;

const CHARS_PER_TOKEN = 4;

export type CompactionTrigger = "auto" | "manual";

export interface CompactionData {
  status: "compacting" | "done";
  trigger: CompactionTrigger;
  summary?: string;
  modelId?: string;
  usage?: MessageTokenUsage;
  contextTokens?: number;
  retainedUserMessageId?: string;
}

export interface CompactionPart {
  type: typeof COMPACTION_PART_TYPE;
  id: string;
  data: CompactionData;
}

interface CompactionLocation {
  messageIndex: number;
  partIndex: number;
  part: CompactionPart;
}

const SUMMARY_INSTRUCTIONS =
  "You are summarizing a conversation between a user and an AI assistant so that the assistant can continue the work with a fresh context window. The summary will replace the conversation history, so it must contain everything needed to continue seamlessly.";

const SUMMARY_REQUEST = `Summarize the conversation so far. Include:
1. The user's goals and requests, quoting exact wording where it matters.
2. Decisions, constraints, and preferences the user expressed.
3. Important facts, results, file names, code, URLs, and tool outputs that will still be needed.
4. Work that has been completed.
5. Work that is in progress and what should happen next.

Write the summary directly with no preamble. Do not continue the conversation or answer any requests, only write the summary.`;

const RETAINED_USER_MESSAGE_NOTE =
  "The user's latest message will be kept verbatim after this summary, so you don't need to repeat it.";

export function isCompactionPart(part: UIMessage["parts"][number]): part is CompactionPart {
  return (
    part.type === COMPACTION_PART_TYPE &&
    "id" in part &&
    typeof part.id === "string" &&
    "data" in part &&
    typeof part.data === "object" &&
    part.data !== null
  );
}

function isCompletedCompactionPart(part: UIMessage["parts"][number]): part is CompactionPart {
  return (
    isCompactionPart(part) &&
    part.data.status === "done" &&
    typeof part.data.summary === "string" &&
    part.data.summary.trim().length > 0
  );
}

export function getCompactionThreshold(modelConfig: ModelConfig): number | null {
  const threshold = modelConfig.compactionThreshold;

  if (threshold === "off") {
    return null;
  }

  if (typeof threshold !== "number" || !Number.isFinite(threshold)) {
    return DEFAULT_COMPACTION_THRESHOLD;
  }

  return Math.min(
    MAX_COMPACTION_THRESHOLD,
    Math.max(MIN_COMPACTION_THRESHOLD, Math.round(threshold)),
  );
}

export function shouldCompact({
  contextTokens,
  contextWindow,
  threshold,
}: {
  contextTokens: number;
  contextWindow: number | undefined;
  threshold: number | null;
}) {
  if (threshold === null || !contextWindow || contextWindow <= 0) {
    return false;
  }

  return contextTokens >= (contextWindow * threshold) / 100;
}

export function findLatestCompaction(messages: UIMessage[]): CompactionLocation | undefined {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex--) {
    const parts = messages[messageIndex].parts;
    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex--) {
      const part = parts[partIndex];
      if (isCompletedCompactionPart(part)) {
        return { messageIndex, partIndex, part };
      }
    }
  }

  return undefined;
}

export function getMessagesAfterCompaction(messages: UIMessage[]): {
  compaction?: CompactionPart;
  messages: UIMessage[];
} {
  const latest = findLatestCompaction(messages);

  if (!latest) {
    return { messages };
  }

  const { messageIndex, partIndex, part } = latest;
  const result: UIMessage[] = [];
  const retainedUserMessageId = part.data.retainedUserMessageId;

  if (retainedUserMessageId) {
    const retainedIndex = messages.findIndex(
      (message) => message.id === retainedUserMessageId && message.role === "user",
    );
    if (retainedIndex !== -1 && retainedIndex <= messageIndex) {
      result.push(messages[retainedIndex]);
    }
  }

  const compactedMessage = messages[messageIndex];
  const remainingParts = compactedMessage.parts
    .slice(partIndex + 1)
    .filter((remainingPart) => !isCompactionPart(remainingPart));

  if (remainingParts.some((remainingPart) => remainingPart.type !== "step-start")) {
    result.push({ ...compactedMessage, parts: remainingParts });
  }

  result.push(...messages.slice(messageIndex + 1));

  return { compaction: part, messages: result };
}

function getSummaryText(summary: string) {
  return `This conversation was compacted to free up space in the context window. Here is a summary of everything that happened before this point:\n\n<summary>\n${summary}\n</summary>`;
}

function toUserContentParts(content: UserModelMessage["content"]) {
  return typeof content === "string" ? [{ type: "text" as const, text: content }] : content;
}

export function withCompactionSummary(summary: string, messages: ModelMessage[]): ModelMessage[] {
  const summaryPart = { type: "text" as const, text: getSummaryText(summary) };
  const [firstMessage, ...rest] = messages;

  if (firstMessage?.role === "user") {
    return [
      { ...firstMessage, content: [summaryPart, ...toUserContentParts(firstMessage.content)] },
      ...rest,
    ];
  }

  return [{ role: "user", content: [summaryPart] }, ...messages];
}

export async function summarizeConversation({
  model,
  messages,
  hasRetainedUserMessage,
  abortSignal,
}: {
  model: LanguageModel;
  messages: ModelMessage[];
  hasRetainedUserMessage: boolean;
  abortSignal?: AbortSignal;
}): Promise<{ summary: string; usage: LanguageModelUsage }> {
  const prunedMessages = pruneMessages({
    messages,
    reasoning: "all",
    toolCalls: "before-last-6-messages",
    emptyMessages: "remove",
  });

  const result = await generateText({
    model,
    instructions: SUMMARY_INSTRUCTIONS,
    messages: [
      ...prunedMessages,
      {
        role: "user",
        content: hasRetainedUserMessage
          ? `${SUMMARY_REQUEST}\n\n${RETAINED_USER_MESSAGE_NOTE}`
          : SUMMARY_REQUEST,
      },
    ],
    abortSignal,
  });

  const summary = result.text.trim();

  if (!summary) {
    throw new Error("The model returned an empty summary.");
  }

  return { summary, usage: result.usage };
}

export function estimateTextTokens(text: string) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function estimatePartTokens(part: UIMessage["parts"][number]): number {
  if (part.type === "text" || part.type === "reasoning") {
    return estimateTextTokens(part.text);
  }

  if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
    const { input, output } = part as { input?: unknown; output?: unknown };
    return estimateTextTokens(JSON.stringify({ input, output }) ?? "");
  }

  return 0;
}

export function estimateMessagesTokens(messages: UIMessage[]) {
  return messages.reduce(
    (total, message) =>
      total + message.parts.reduce((sum, part) => sum + estimatePartTokens(part), 0),
    0,
  );
}

export function getUsageContextTokens(usage: MessageTokenUsage | LanguageModelUsage | undefined) {
  const inputTokens = usage?.inputTokens;
  const outputTokens = usage?.outputTokens;
  return (
    (typeof inputTokens === "number" && Number.isFinite(inputTokens) ? inputTokens : 0) +
    (typeof outputTokens === "number" && Number.isFinite(outputTokens) ? outputTokens : 0)
  );
}

export function estimateContextTokens(messages: UIMessage[]): number {
  const latest = findLatestCompaction(messages);

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "assistant") continue;

    const metadata = message.metadata as ChatMessageMetadata | undefined;
    if (!metadata?.usage) continue;

    const isUsageAfterCompaction =
      !latest || i > latest.messageIndex || metadata.compactionId === latest.part.id;

    if (!isUsageAfterCompaction) break;

    return getUsageContextTokens(metadata.usage) + estimateMessagesTokens(messages.slice(i + 1));
  }

  if (!latest) {
    return estimateMessagesTokens(messages);
  }

  const { messageIndex, partIndex, part } = latest;
  const remainingParts = messages[messageIndex].parts.slice(partIndex + 1);

  return (
    (part.data.contextTokens ?? 0) +
    remainingParts.reduce((sum, remainingPart) => sum + estimatePartTokens(remainingPart), 0) +
    estimateMessagesTokens(messages.slice(messageIndex + 1))
  );
}

export function createCompactionChunk(
  id: string,
  data: CompactionData,
): Extract<UIMessageChunk, { type: `data-${string}` }> {
  return { type: COMPACTION_PART_TYPE, id, data };
}

export class UIMessageChunkInjector {
  private controller: TransformStreamDefaultController<UIMessageChunk> | undefined;
  private pendingChunks: UIMessageChunk[] = [];
  private canWriteDirectly = false;

  readonly transform = new TransformStream<UIMessageChunk, UIMessageChunk>({
    start: (controller) => {
      this.controller = controller;
    },
    transform: (chunk, controller) => {
      if (chunk.type === "start-step") {
        this.flushPendingChunks();
        this.canWriteDirectly = false;
      }

      controller.enqueue(chunk);

      if (chunk.type === "start" || chunk.type === "finish-step") {
        this.canWriteDirectly = true;
        this.flushPendingChunks();
      }
    },
    flush: () => {
      this.flushPendingChunks();
    },
  });

  write(chunk: UIMessageChunk) {
    if (this.canWriteDirectly && this.controller) {
      this.controller.enqueue(chunk);
      return;
    }

    this.pendingChunks.push(chunk);
  }

  private flushPendingChunks() {
    if (!this.controller) return;

    for (const chunk of this.pendingChunks) {
      this.controller.enqueue(chunk);
    }
    this.pendingChunks = [];
  }
}
