import {
  generateText,
  type LanguageModel,
  type LanguageModelUsage,
  type ModelMessage,
  type PrepareStepFunction,
  type ToolSet,
  type UIMessage,
} from "ai";
import { getDefaultStore } from "jotai";

import { type ChatMessageMetadata, normalizeUsage } from "@/lib/ai/chat-usage";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { SETTINGS } from "@/lib/settings/definitions";

const logger = getLogger(import.meta.url);

export const COMPACTION_PART_TYPE = "data-compaction";
export const COMPACT_REQUEST_BODY_KEY = "agentOneCompact";

const CHARS_PER_TOKEN = 4;
const MAX_TOOL_VALUE_CHARS = 4000;
const DEFAULT_MAX_TRANSCRIPT_CHARS = 400_000;
const TRANSCRIPT_CONTEXT_RATIO = 0.6;
const CONTINUE_PROMPT = "Continue from where you left off.";

const SUMMARY_INSTRUCTIONS = `You summarize conversations between a user and an AI assistant so that the assistant can keep working with a shorter context.

Write a detailed summary that preserves everything needed to continue the conversation:
- The user's goals, requests, preferences, and any constraints they gave.
- Important facts, decisions, names, numbers, file paths, URLs, commands, and code.
- Results of tool calls that still matter.
- The current state of any ongoing task, including what is done and what remains.

Write the summary in the same language as the conversation. Respond with the summary only.`;

export interface CompactionData {
  summary: string;
  throughMessageId: string;
}

interface CompactionLocation {
  data: CompactionData;
  messageIndex: number;
  partIndex: number;
}

export interface ActiveContext {
  summary?: string;
  messages: UIMessage[];
}

function isCompactionData(data: unknown): data is CompactionData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as CompactionData).summary === "string" &&
    typeof (data as CompactionData).throughMessageId === "string"
  );
}

export function getCompactionData(part: UIMessage["parts"][number]): CompactionData | null {
  if (part.type !== COMPACTION_PART_TYPE || !("data" in part)) {
    return null;
  }

  return isCompactionData(part.data) ? part.data : null;
}

function findLatestCompaction(messages: UIMessage[]): CompactionLocation | null {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex--) {
    const parts = messages[messageIndex].parts;
    for (let partIndex = parts.length - 1; partIndex >= 0; partIndex--) {
      const data = getCompactionData(parts[partIndex]);
      if (data) {
        return { data, messageIndex, partIndex };
      }
    }
  }

  return null;
}

// Everything up to and including `throughMessageId` is replaced by the summary. When the
// compaction part lives inside that message, the parts after it are kept.
export function getActiveContext(messages: UIMessage[]): ActiveContext {
  const latest = findLatestCompaction(messages);
  if (!latest) {
    return { messages };
  }

  const { data, messageIndex, partIndex } = latest;
  const throughIndex = messages.findIndex((message) => message.id === data.throughMessageId);
  const startIndex = throughIndex === -1 ? messageIndex : throughIndex;
  const keptMessages: UIMessage[] = [];

  if (startIndex === messageIndex) {
    const remainingParts = messages[messageIndex].parts.slice(partIndex + 1);
    if (remainingParts.length > 0) {
      keptMessages.push({ ...messages[messageIndex], parts: remainingParts });
    }
  }

  keptMessages.push(...messages.slice(startIndex + 1));

  return { summary: data.summary, messages: keptMessages };
}

export function hasMessagesToCompact(messages: UIMessage[]): boolean {
  return getActiveContext(messages).messages.some((message) =>
    message.parts.some((part) => part.type !== COMPACTION_PART_TYPE && part.type !== "step-start"),
  );
}

function estimateTextTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function estimateMessageTokens(messages: UIMessage[]): number {
  let chars = 0;
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "text" || part.type === "reasoning") {
        chars += part.text.length;
      } else if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
        const { input, output } = part as { input?: unknown; output?: unknown };
        chars += (JSON.stringify({ input, output }) ?? "").length;
      }
    }
  }

  return Math.ceil(chars / CHARS_PER_TOKEN);
}

function getUsageContextTokens(usage: ChatMessageMetadata["usage"] | LanguageModelUsage) {
  const normalized = normalizeUsage(usage);
  return normalized.inputTokens + normalized.outputTokens;
}

export function estimateContextTokens(messages: UIMessage[]): number {
  const latest = findLatestCompaction(messages);

  for (let i = messages.length - 1; i >= 0; i--) {
    if (latest && i < latest.messageIndex) {
      break;
    }

    const message = messages[i];
    const metadata = message.metadata as ChatMessageMetadata | undefined;
    if (message.role !== "assistant" || typeof metadata !== "object" || !metadata?.usage) {
      continue;
    }

    const usageIsFromBeforeCompaction =
      latest && i === latest.messageIndex && latest.partIndex === message.parts.length - 1;
    if (usageIsFromBeforeCompaction) {
      break;
    }

    const tokens = getUsageContextTokens(metadata.usage);
    if (tokens > 0) {
      return tokens;
    }
  }

  const context = getActiveContext(messages);
  return estimateTextTokens(context.summary ?? "") + estimateMessageTokens(context.messages);
}

export function getAutoCompactThreshold(): number | null {
  const store = getDefaultStore();
  if (store.get(settingAtoms.AUTO_COMPACT_ENABLED) === false) {
    return null;
  }

  const { default: defaultValue, min, max } = SETTINGS.AUTO_COMPACT_THRESHOLD;
  const value: unknown = store.get(settingAtoms.AUTO_COMPACT_THRESHOLD);
  const percent =
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(Math.max(value, min), max)
      : defaultValue;

  return percent / 100;
}

export function buildInstructionsWithSummary(instructions: string, summary: string | undefined) {
  if (!summary) {
    return instructions;
  }

  return `${instructions}\n\n## Conversation Summary\nEarlier messages in this conversation were summarized to save space. Use this summary as context for the rest of the conversation:\n\n${summary}`;
}

export function ensureStartsWithUserMessage(messages: ModelMessage[]): ModelMessage[] {
  if (messages[0]?.role === "user") {
    return messages;
  }

  return [{ role: "user", content: CONTINUE_PROMPT }, ...messages];
}

function truncate(value: unknown, limit: number): string {
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? "");
  return text.length > limit ? `${text.slice(0, limit)}… [truncated]` : text;
}

function formatContentPart(part: Exclude<ModelMessage["content"], string>[number]) {
  switch (part.type) {
    case "text":
      return part.text;
    case "file":
      return `[File${part.filename ? `: ${part.filename}` : ""} (${part.mediaType})]`;
    case "image":
      return "[Image]";
    case "tool-call":
      return `[Called tool "${part.toolName}" with input: ${truncate(part.input, MAX_TOOL_VALUE_CHARS)}]`;
    case "tool-result": {
      const output = "value" in part.output ? part.output.value : part.output;
      return `[Tool "${part.toolName}" returned: ${truncate(output, MAX_TOOL_VALUE_CHARS)}]`;
    }
    default:
      return null;
  }
}

function formatTranscript(messages: ModelMessage[]): string {
  return messages
    .flatMap((message) => {
      if (message.role === "system") {
        return [];
      }

      const lines =
        typeof message.content === "string"
          ? [message.content]
          : message.content.map(formatContentPart).filter((line) => line !== null);
      if (lines.length === 0) {
        return [];
      }

      const label =
        message.role === "user" ? "User" : message.role === "assistant" ? "Assistant" : "Tool";
      return [`${label}:\n${lines.join("\n")}`];
    })
    .join("\n\n");
}

export async function summarizeConversation({
  model,
  previousSummary,
  messages,
  contextWindow,
  abortSignal,
}: {
  model: LanguageModel;
  previousSummary?: string;
  messages: ModelMessage[];
  contextWindow?: number;
  abortSignal?: AbortSignal;
}): Promise<{ summary: string; usage: LanguageModelUsage }> {
  const maxChars = contextWindow
    ? Math.floor(contextWindow * TRANSCRIPT_CONTEXT_RATIO * CHARS_PER_TOKEN)
    : DEFAULT_MAX_TRANSCRIPT_CHARS;
  let transcript = formatTranscript(messages);
  if (transcript.length > maxChars) {
    transcript = `[The start of this part of the conversation was too long to include.]\n\n${transcript.slice(-maxChars)}`;
  }

  logger.verbose("Summarizing conversation for context compaction", {
    messageCount: messages.length,
    transcriptLength: transcript.length,
  });

  const result = await generateText({
    model,
    instructions: SUMMARY_INSTRUCTIONS,
    prompt: `${previousSummary ? `Summary of the conversation before this point:\n${previousSummary}\n\n` : ""}Conversation to summarize:\n${transcript}`,
    abortSignal,
  });

  const summary = result.text.trim();
  if (!summary) {
    throw new Error("The model returned an empty summary while compacting the conversation.");
  }

  return { summary, usage: result.totalUsage };
}

export function createCompactionPrepareStep({
  model,
  contextWindow,
  instructions,
  summary,
  abortSignal,
  onCompaction,
}: {
  model: LanguageModel;
  contextWindow: number | undefined;
  instructions: string;
  summary?: string;
  abortSignal?: AbortSignal;
  onCompaction?: (result: { summary: string; usage: LanguageModelUsage }) => void;
}): PrepareStepFunction<ToolSet> | undefined {
  const threshold = getAutoCompactThreshold();
  if (threshold === null || !contextWindow) {
    return undefined;
  }

  let currentSummary = summary;
  let compactedInstructions: string | undefined;
  let lastCompactedStep = -Infinity;

  return async ({ steps, messages, stepNumber }) => {
    const lastStep = steps.at(-1);
    const tokens = lastStep
      ? getUsageContextTokens(lastStep.usage) || estimateTextTokens(JSON.stringify(messages) ?? "")
      : 0;

    if (tokens < contextWindow * threshold || stepNumber - lastCompactedStep < 2) {
      return compactedInstructions ? { instructions: compactedInstructions } : undefined;
    }

    let result: Awaited<ReturnType<typeof summarizeConversation>>;
    try {
      result = await summarizeConversation({
        model,
        previousSummary: currentSummary,
        messages,
        contextWindow,
        abortSignal,
      });
    } catch (error) {
      if (abortSignal?.aborted) {
        throw error;
      }
      logger.warn("Failed to compact context between steps, continuing without it", error);
      lastCompactedStep = stepNumber;
      return compactedInstructions ? { instructions: compactedInstructions } : undefined;
    }

    currentSummary = result.summary;
    compactedInstructions = buildInstructionsWithSummary(instructions, result.summary);
    lastCompactedStep = stepNumber;
    onCompaction?.(result);

    return {
      instructions: compactedInstructions,
      messages: [{ role: "user", content: CONTINUE_PROMPT }],
    };
  };
}
