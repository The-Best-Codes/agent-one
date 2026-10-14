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
export const DEFAULT_COMPACTION_THRESHOLD = 90;
export const MIN_COMPACTION_THRESHOLD = 5;
export const MAX_COMPACTION_THRESHOLD = 95;

export interface CompactionData {
  status: "compacting" | "done";
  summary?: string;
  modelId?: string;
  usage?: MessageTokenUsage;
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
  "You are summarizing a conversation between a user and an AI assistant so that the assistant can continue the work with a fresh context window. The summary will replace the conversation history, so it must contain everything needed to continue seamlessly. You can only see the messages, not the assistant's system prompt or tools, so the assistant may know things that never appear in the conversation (such as the user's name). Record what happened without judging it.";

const SUMMARY_REQUEST = `Summarize the conversation so far. Cover:
- The user's goals and requests, quoting exact wording where it matters.
- Decisions, constraints, and preferences the user expressed.
- Important facts, results, file names, code, URLs, and tool outputs that will still be needed.
- Work that has been completed.
- Work that is in progress and what should happen next.

Leave out anything that doesn't apply instead of saying it's empty. Don't comment on whether the assistant was right or where its information came from. Write the summary directly with no preamble. Do not continue the conversation or answer any requests, only write the summary.`;

const NEW_USER_MESSAGE_START =
  "<new_user_message>\nThe user just sent this message and it hasn't been answered yet. Include it in the summary as the current request:";
const NEW_USER_MESSAGE_END = "</new_user_message>";

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

function labelNewUserMessage(messages: ModelMessage[], startsWithSummary: boolean): ModelMessage[] {
  const lastIndex = messages.length - 1;
  const lastMessage = messages[lastIndex];

  if (lastMessage?.role !== "user") {
    return messages;
  }

  const parts = toUserContentParts(lastMessage.content);
  const summaryParts = lastIndex === 0 && startsWithSummary ? parts.slice(0, 1) : [];
  const userParts = parts.slice(summaryParts.length);

  if (userParts.length === 0) {
    return messages;
  }

  return [
    ...messages.slice(0, lastIndex),
    {
      ...lastMessage,
      content: [
        ...summaryParts,
        { type: "text", text: NEW_USER_MESSAGE_START },
        ...userParts,
        { type: "text", text: NEW_USER_MESSAGE_END },
      ],
    },
  ];
}

export async function summarizeConversation({
  model,
  messages,
  startsWithSummary,
  abortSignal,
}: {
  model: LanguageModel;
  messages: ModelMessage[];
  startsWithSummary: boolean;
  abortSignal?: AbortSignal;
}): Promise<{ summary: string; usage: LanguageModelUsage }> {
  const prunedMessages = pruneMessages({
    messages: labelNewUserMessage(messages, startsWithSummary),
    reasoning: "all",
    emptyMessages: "remove",
  });

  const result = await generateText({
    model,
    instructions: SUMMARY_INSTRUCTIONS,
    messages: [...prunedMessages, { role: "user", content: SUMMARY_REQUEST }],
    abortSignal,
  });

  const summary = result.text.trim();

  if (!summary) {
    throw new Error("The model returned an empty summary.");
  }

  return { summary, usage: result.usage };
}

export function estimateTokens(value: unknown) {
  const text =
    typeof value === "string"
      ? value
      : JSON.stringify(value, (_key, item: unknown) =>
          item && typeof item === "object" && ("mediaType" in item || "mimeType" in item)
            ? undefined
            : item,
        );
  return Math.ceil((text ?? "").length / 4);
}

export function getUsageContextTokens(usage: MessageTokenUsage | LanguageModelUsage | undefined) {
  return (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
}

export function getContextTokens(messages: UIMessage[]): number {
  const latest = findLatestCompaction(messages);

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "assistant") continue;

    const metadata = message.metadata as ChatMessageMetadata | undefined;
    if (!metadata?.usage) continue;

    if (!latest || i > latest.messageIndex || metadata.compactionId === latest.part.id) {
      return getUsageContextTokens(metadata.usage);
    }

    break;
  }

  return latest?.part.data.usage?.outputTokens ?? 0;
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
