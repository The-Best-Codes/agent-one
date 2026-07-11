import type { Context, Tool, ToolExecutionOptions } from "@ai-sdk/provider-utils";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  type LanguageModel,
  readUIMessageStream,
  isStepCount,
  streamText,
  toUIMessageStream,
  type ModelMessage,
  type ToolSet,
  type UIMessage,
  wrapLanguageModel,
} from "ai";
import { z } from "zod";

import type { ModelConfig } from "@/hooks/ai/use-model-catalog";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const SUBAGENT_TOOL_NAME = "subAgent";

export interface SubAgentToolConfig {
  requiresApproval: boolean;
}

export interface SubAgentInput {
  task: string;
}

export interface SubAgentExecutionContext {
  model: LanguageModel;
  modelConfig: ModelConfig;
  systemPrompt: string;
  extractReasoningEnabled: boolean;
  getTools: () => Promise<ToolSet>;
}

export interface SubAgentLiveState {
  toolCallId: string;
  status: "running" | "waiting-approval" | "completed";
  message: UIMessage | null;
  pendingApprovalIds: string[];
}

type NestedStreamingOutput = {
  kind: "streaming";
  message: UIMessage;
};

type NestedCompleteOutput = {
  kind: "complete";
  message: UIMessage;
};

export type SubAgentOutput = NestedStreamingOutput | NestedCompleteOutput;

type ApprovalResponse = {
  approved: boolean;
  reason?: string;
};

const subAgentLiveStateMap = new Map<string, SubAgentLiveState>();
const subAgentListenersMap = new Map<string, Set<() => void>>();
const subAgentApprovalWaiters = new Map<
  string,
  {
    resolve: (response: ApprovalResponse) => void;
    reject: (error: Error) => void;
  }
>();

function buildSubAgentInstructions(systemPrompt: string): string {
  return `${systemPrompt}\n\n## Subagent Instructions\nYou are a subagent working for AgentOne. Complete the assigned task autonomously. Use the available tools when helpful. You have the same tool permissions as the main agent, except you cannot spawn more subagents. When you finish, provide a concise but complete summary of the outcome as your final response.`;
}

function cloneMessage(message: UIMessage): UIMessage {
  return structuredClone(message);
}

function emitLiveState(toolCallId: string) {
  const listeners = subAgentListenersMap.get(toolCallId);
  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener();
  }
}

function setLiveState(toolCallId: string, state: SubAgentLiveState) {
  subAgentLiveStateMap.set(toolCallId, state);
  emitLiveState(toolCallId);
}

function updateLiveState(
  toolCallId: string,
  updater: (state: SubAgentLiveState) => SubAgentLiveState,
) {
  const current = subAgentLiveStateMap.get(toolCallId);
  if (!current) {
    return;
  }

  setLiveState(toolCallId, updater(current));
}

export function getSubAgentLiveState(toolCallId: string) {
  return subAgentLiveStateMap.get(toolCallId) ?? null;
}

export function subscribeSubAgentLiveState(toolCallId: string, listener: () => void) {
  const listeners = subAgentListenersMap.get(toolCallId) ?? new Set<() => void>();
  listeners.add(listener);
  subAgentListenersMap.set(toolCallId, listeners);

  return () => {
    const current = subAgentListenersMap.get(toolCallId);
    if (!current) {
      return;
    }

    current.delete(listener);
    if (current.size === 0) {
      subAgentListenersMap.delete(toolCallId);
    }
  };
}

function waitForApprovalResponse(
  approvalId: string,
  abortSignal?: AbortSignal,
): Promise<ApprovalResponse> {
  if (subAgentApprovalWaiters.has(approvalId)) {
    throw new Error(`Approval ${approvalId} is already pending.`);
  }

  return new Promise<ApprovalResponse>((resolve, reject) => {
    const waiter = {
      resolve: (response: ApprovalResponse) => {
        subAgentApprovalWaiters.delete(approvalId);
        resolve(response);
      },
      reject: (error: Error) => {
        subAgentApprovalWaiters.delete(approvalId);
        reject(error);
      },
    };

    subAgentApprovalWaiters.set(approvalId, waiter);

    if (!abortSignal) {
      return;
    }

    const onAbort = () => {
      waiter.reject(new DOMException("Aborted", "AbortError"));
    };

    if (abortSignal.aborted) {
      onAbort();
      return;
    }

    abortSignal.addEventListener("abort", onAbort, { once: true });
  });
}

function patchApprovalResponses(message: UIMessage, responses: Map<string, ApprovalResponse>) {
  return {
    ...message,
    parts: message.parts.map((part) => {
      if (!part.type.startsWith("tool-") || !("state" in part)) {
        return part;
      }

      if (
        part.state !== "approval-requested" ||
        !("approval" in part) ||
        !responses.has(part.approval.id)
      ) {
        return part;
      }

      const response = responses.get(part.approval.id)!;
      return {
        ...part,
        state: "approval-responded",
        approval: {
          id: part.approval.id,
          approved: response.approved,
          reason: response.reason,
        },
      };
    }),
  } satisfies UIMessage;
}

export function respondToSubAgentApproval(
  toolCallId: string,
  approvalId: string,
  approved: boolean,
  reason?: string,
) {
  updateLiveState(toolCallId, (state) => ({
    ...state,
    message:
      state.message && state.pendingApprovalIds.includes(approvalId)
        ? patchApprovalResponses(state.message, new Map([[approvalId, { approved, reason }]]))
        : state.message,
    pendingApprovalIds: state.pendingApprovalIds.filter((id) => id !== approvalId),
    status:
      state.pendingApprovalIds.filter((id) => id !== approvalId).length > 0
        ? "waiting-approval"
        : "running",
  }));

  subAgentApprovalWaiters.get(approvalId)?.resolve({ approved, reason });
}

function extractSummaryText(message: UIMessage | undefined): string {
  if (!message) {
    return "Subagent finished.";
  }

  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  return text || "Subagent finished.";
}

function excludeSubAgentTool(tools: ToolSet): ToolSet {
  return Object.fromEntries(Object.entries(tools).filter(([name]) => name !== SUBAGENT_TOOL_NAME));
}

async function* streamSubAgentRun({
  task,
  messages,
  abortSignal,
  toolCallId,
  context,
}: {
  task: string;
  messages: ModelMessage[];
  abortSignal?: AbortSignal;
  toolCallId: string;
  context: SubAgentExecutionContext;
}): AsyncGenerator<SubAgentOutput, UIMessage | undefined, undefined> {
  const tools = excludeSubAgentTool(await context.getTools());
  const subAgentMessages: UIMessage[] = [];
  let finalMessage: UIMessage | undefined;

  const wrappedModel =
    context.extractReasoningEnabled && typeof context.model !== "string"
      ? wrapLanguageModel({
          model: context.model as Parameters<typeof wrapLanguageModel>[0]["model"],
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        })
      : context.model;

  while (true) {
    abortSignal?.throwIfAborted();

    const promptMessages =
      subAgentMessages.length === 0
        ? ([
            ...messages,
            { role: "user", content: [{ type: "text", text: task }] },
          ] satisfies ModelMessage[])
        : await convertToModelMessages(subAgentMessages, {
            tools,
            ignoreIncompleteToolCalls: true,
          });

    const result = streamText({
      model: wrappedModel,
      temperature: context.modelConfig.temperature,
      maxOutputTokens: context.modelConfig.maxTokens,
      topP: context.modelConfig.topP,
      topK: context.modelConfig.topK,
      frequencyPenalty: context.modelConfig.frequencyPenalty,
      presencePenalty: context.modelConfig.presencePenalty,
      seed: context.modelConfig.seed,
      messages: promptMessages,
      abortSignal,
      tools,
      toolChoice: "auto",
      stopWhen: isStepCount(context.modelConfig.maxSteps ?? 20),
      instructions: buildSubAgentInstructions(context.systemPrompt),
    });

    let latestMessage: UIMessage | undefined;

    for await (const message of readUIMessageStream({
      stream: toUIMessageStream({ stream: result.stream, tools }),
      message: subAgentMessages.at(-1),
    })) {
      latestMessage = cloneMessage(message);
      setLiveState(toolCallId, {
        toolCallId,
        status: "running",
        message: latestMessage,
        pendingApprovalIds: [],
      });
      yield {
        kind: "streaming",
        message: latestMessage,
      };
    }

    if (!latestMessage) {
      break;
    }

    if (subAgentMessages.length > 0 && subAgentMessages.at(-1)?.id === latestMessage.id) {
      subAgentMessages[subAgentMessages.length - 1] = latestMessage;
    } else {
      subAgentMessages.push(latestMessage);
    }

    finalMessage = latestMessage;

    const hasPendingApproval = latestMessage.parts.some(
      (part) =>
        part.type.startsWith("tool-") && "state" in part && part.state === "approval-requested",
    );

    if (!hasPendingApproval) {
      break;
    }

    const approvalIds = latestMessage.parts.flatMap((part) => {
      if (
        !part.type.startsWith("tool-") ||
        !("state" in part) ||
        part.state !== "approval-requested" ||
        !("approval" in part)
      ) {
        return [];
      }

      return [part.approval.id];
    });

    setLiveState(toolCallId, {
      toolCallId,
      status: "waiting-approval",
      message: latestMessage,
      pendingApprovalIds: approvalIds,
    });

    const responses = new Map(
      await Promise.all(
        approvalIds.map(
          async (approvalId) =>
            [approvalId, await waitForApprovalResponse(approvalId, abortSignal)] as const,
        ),
      ),
    );

    const patchedMessage = patchApprovalResponses(latestMessage, responses);
    subAgentMessages[subAgentMessages.length - 1] = patchedMessage;
    setLiveState(toolCallId, {
      toolCallId,
      status: "running",
      message: patchedMessage,
      pendingApprovalIds: [],
    });
    yield {
      kind: "streaming",
      message: patchedMessage,
    };
  }

  setLiveState(toolCallId, {
    toolCallId,
    status: "completed",
    message: finalMessage ?? null,
    pendingApprovalIds: [],
  });

  if (finalMessage) {
    yield {
      kind: "complete",
      message: finalMessage,
    };
  }

  return finalMessage;
}

export const createSubAgentTool = (
  config: SubAgentToolConfig,
  context: SubAgentExecutionContext,
) => {
  return {
    description:
      "Spawn a subagent to work on a focused task. The subagent can use the same tools as you, except it cannot spawn more subagents.",
    needsApproval: config.requiresApproval,
    inputSchema: z.object({
      task: z.string().min(1).describe("The task for the subagent to complete"),
    }),
    execute: async function* (input: SubAgentInput, options: ToolExecutionOptions<Context>) {
      logger.verbose("Executing subAgent tool with input:", input);

      setLiveState(options.toolCallId, {
        toolCallId: options.toolCallId,
        status: "running",
        message: null,
        pendingApprovalIds: [],
      });

      for await (const value of streamSubAgentRun({
        task: input.task,
        messages: options.messages,
        abortSignal: options.abortSignal,
        toolCallId: options.toolCallId,
        context,
      })) {
        yield value;
      }

      return undefined;
    },
    toModelOutput: ({ output }: { output: SubAgentOutput | undefined }) => ({
      type: "text" as const,
      value: extractSummaryText(output?.message),
    }),
  } satisfies Tool<SubAgentInput, SubAgentOutput | undefined>;
};

export type SubAgentTool = ReturnType<typeof createSubAgentTool>;
