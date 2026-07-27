import { type UIMessage } from "@ai-sdk/react";
import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  extractReasoningMiddleware,
  type LanguageModel,
  type ModelMessage,
  smoothStream,
  isStepCount,
  type StopCondition,
  streamText,
  toUIMessageStream,
  type ToolSet,
  type UIMessageChunk,
  wrapLanguageModel,
} from "ai";

import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import {
  addMessageTokenUsage,
  createEmptyMessageTokenUsage,
  type ChatMessageMetadata,
} from "@/lib/ai/chat-usage";
import type { SubAgentExecutionContext } from "@/lib/ai/tools/subAgent";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private model: LanguageModel | null;
  private modelId: string | null;
  private modelConfig: ModelConfig;
  private smoothStreamEnabled: boolean;
  private extractReasoningEnabled: boolean;
  private mcpAppModelContexts = new Map<string, unknown>();
  private getTools: (options?: { subAgentContext?: SubAgentExecutionContext }) => Promise<ToolSet>;
  private getSystemPrompt: () => string;
  private getApiKeysLoadedPromise: () => Promise<void>;

  constructor(
    model: LanguageModel | null,
    modelId: string | null,
    modelConfig: ModelConfig,
    smoothStreamEnabled: boolean,
    extractReasoningEnabled: boolean,
    getTools: (options?: { subAgentContext?: SubAgentExecutionContext }) => Promise<ToolSet>,
    getSystemPrompt: () => string,
    getApiKeysLoadedPromise: () => Promise<void>,
  ) {
    this.model = model;
    this.modelId = modelId;
    this.modelConfig = modelConfig;
    this.smoothStreamEnabled = smoothStreamEnabled;
    this.extractReasoningEnabled = extractReasoningEnabled;
    this.getTools = getTools;
    this.getSystemPrompt = getSystemPrompt;
    this.getApiKeysLoadedPromise = getApiKeysLoadedPromise;
  }

  updateModel(model: LanguageModel | null) {
    this.model = model;
    logger.verbose(
      "CustomChatTransport model updated to:",
      typeof model === "string" ? model : model?.modelId,
    );
  }

  updateModelId(modelId: string | null) {
    this.modelId = modelId;
    logger.verbose("CustomChatTransport modelId updated to:", modelId);
  }

  updateModelConfig(modelConfig: ModelConfig) {
    this.modelConfig = modelConfig;
    logger.verbose("CustomChatTransport config updated");
  }

  updateSmoothStreamEnabled(smoothStreamEnabled: boolean) {
    this.smoothStreamEnabled = smoothStreamEnabled;
    logger.verbose("CustomChatTransport smoothStreamEnabled updated to:", smoothStreamEnabled);
  }

  updateExtractReasoningEnabled(extractReasoningEnabled: boolean) {
    this.extractReasoningEnabled = extractReasoningEnabled;
    logger.verbose(
      "CustomChatTransport extractReasoningEnabled updated to:",
      extractReasoningEnabled,
    );
  }

  updateSystemPrompt(getSystemPrompt: () => string) {
    this.getSystemPrompt = getSystemPrompt;
    logger.verbose("CustomChatTransport system prompt updated");
  }

  updateGetApiKeysLoadedPromise(getApiKeysLoadedPromise: () => Promise<void>) {
    this.getApiKeysLoadedPromise = getApiKeysLoadedPromise;
    logger.verbose("CustomChatTransport API keys loaded promise updated");
  }

  updateMcpAppModelContext(viewId: string, context: unknown) {
    this.mcpAppModelContexts.set(viewId, context);
  }

  private getMcpAppModelContextMessage(): ModelMessage | undefined {
    if (this.mcpAppModelContexts.size === 0) {
      return undefined;
    }

    const contexts = [...this.mcpAppModelContexts.entries()].map(
      ([viewId, context]) => `MCP App view ${viewId}: ${JSON.stringify(context)}`,
    );
    return {
      role: "user",
      content: `Background context reported by interactive MCP Apps:\n${contexts.join("\n")}`,
    };
  }

  async sendMessages(
    options: {
      chatId: string;
      messages: UIMessage[];
      abortSignal: AbortSignal | undefined;
    } & {
      trigger: "submit-message" | "regenerate-message";
      messageId: string | undefined;
    } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk>> {
    const baseModel = this.model;
    const modelId = this.modelId;
    const modelConfig = this.modelConfig;
    const smoothStreamEnabled = this.smoothStreamEnabled;
    const extractReasoningEnabled = this.extractReasoningEnabled;

    if (!baseModel) {
      throw new Error("Cannot send messages: no model selected. Please select a model first.");
    }

    const model =
      extractReasoningEnabled && typeof baseModel !== "string"
        ? wrapLanguageModel({
            model: baseModel as Parameters<typeof wrapLanguageModel>[0]["model"],
            middleware: extractReasoningMiddleware({ tagName: "think" }),
          })
        : baseModel;

    await this.getApiKeysLoadedPromise();
    const subAgentContext: SubAgentExecutionContext = {
      model: baseModel,
      modelConfig,
      systemPrompt: this.getSystemPrompt(),
      extractReasoningEnabled,
      getTools: () => this.getTools({ subAgentContext }),
    };
    const tools = await this.getTools({ subAgentContext });

    const stopWhenCondition: StopCondition<ToolSet> =
      modelConfig.maxSteps === undefined ? () => false : isStepCount(modelConfig.maxSteps);
    const messages = await convertToModelMessages(options.messages);
    const mcpAppContextMessage = this.getMcpAppModelContextMessage();
    if (mcpAppContextMessage) {
      let insertionIndex = messages.length;
      for (let index = messages.length - 1; index >= 0; index--) {
        if (messages[index].role === "user") {
          insertionIndex = index;
          break;
        }
      }
      messages.splice(insertionIndex, 0, mcpAppContextMessage);
    }

    const result = streamText({
      model,
      temperature: modelConfig.temperature,
      maxOutputTokens: modelConfig.maxTokens,
      topP: modelConfig.topP,
      topK: modelConfig.topK,
      frequencyPenalty: modelConfig.frequencyPenalty,
      presencePenalty: modelConfig.presencePenalty,
      seed: modelConfig.seed,
      messages,
      abortSignal: options.abortSignal,
      tools,
      toolChoice: "auto",
      stopWhen: stopWhenCondition,
      // activeTools: [], // COMMENT OUT THIS LINE TO USE TOOLS
      instructions: this.getSystemPrompt(),
      ...(smoothStreamEnabled && {
        experimental_transform: smoothStream(),
      }),
      onError: (error) => {
        logger.error("Error occurred in CustomChatTransport streamText:", error);
      },
      onAbort: () => {
        logger.verbose("Stream aborted");
      },
    });

    let totalUsage = createEmptyMessageTokenUsage();

    return toUIMessageStream({
      stream: result.stream,
      tools,
      messageMetadata: ({ part }) => {
        if (part.type !== "finish-step") {
          return undefined;
        }

        totalUsage = addMessageTokenUsage(totalUsage, part.usage);

        const metadata: ChatMessageMetadata = {
          modelId: modelId ?? undefined,
          usage: part.usage,
          totalUsage,
        };

        return metadata;
      },
      onError: (error) => {
        logger.error("Error occurred in CustomChatTransport toUIMessageStream:", error);

        if (error == null) {
          return "Unknown error";
        }

        if (typeof error === "string") {
          return error;
        }

        if (error instanceof Error) {
          return error.message;
        }

        return JSON.stringify(error);
      },
    });
  }

  async reconnectToStream(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: {
      chatId: string;
    } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    // Leaving this unimplemented for now,
    // as our implementation is frontend-only.
    logger.warn(
      "resumeStream is not implemented in frontend-only applications. Please don't use it.",
    );
    return null;
  }
}
