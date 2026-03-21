import { type UIMessage } from "@ai-sdk/react";
import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  type LanguageModel,
  smoothStream,
  stepCountIs,
  type StopCondition,
  streamText,
  type ToolSet,
  type UIMessageChunk,
} from "ai";

import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import {
  calculateCostUsdFromUsage,
  type ChatMessageMetadata,
  getModelCostByChatModelId,
} from "@/lib/ai/chat-usage";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private model: LanguageModel | null;
  private modelId: string | null;
  private modelConfig: ModelConfig;
  private smoothStreamEnabled: boolean;
  private getTools: () => Promise<ToolSet>;
  private getSystemPrompt: () => string;
  private getApiKeysLoadedPromise: () => Promise<void>;

  constructor(
    model: LanguageModel | null,
    modelId: string | null,
    modelConfig: ModelConfig,
    smoothStreamEnabled: boolean,
    getTools: () => Promise<ToolSet>,
    getSystemPrompt: () => string,
    getApiKeysLoadedPromise: () => Promise<void>,
  ) {
    this.model = model;
    this.modelId = modelId;
    this.modelConfig = modelConfig;
    this.smoothStreamEnabled = smoothStreamEnabled;
    this.getTools = getTools;
    this.getSystemPrompt = getSystemPrompt;
    this.getApiKeysLoadedPromise = getApiKeysLoadedPromise;
  }

  updateModel(model: LanguageModel | null) {
    this.model = model;
    logger.verbose("CustomChatTransport model updated to:", model);
  }

  updateModelId(modelId: string | null) {
    this.modelId = modelId;
    logger.verbose("CustomChatTransport modelId updated to:", modelId);
  }

  updateModelConfig(config: ModelConfig) {
    this.modelConfig = config;
    logger.verbose("CustomChatTransport config updated");
  }

  updateSmoothStreamEnabled(smoothStreamEnabled: boolean) {
    this.smoothStreamEnabled = smoothStreamEnabled;
    logger.verbose("CustomChatTransport smoothStreamEnabled updated to:", smoothStreamEnabled);
  }

  updateSystemPrompt(getSystemPrompt: () => string) {
    this.getSystemPrompt = getSystemPrompt;
    logger.verbose("CustomChatTransport system prompt updated");
  }

  updateGetApiKeysLoadedPromise(getApiKeysLoadedPromise: () => Promise<void>) {
    this.getApiKeysLoadedPromise = getApiKeysLoadedPromise;
    logger.verbose("CustomChatTransport API keys loaded promise updated");
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
    if (!this.model) {
      throw new Error("Cannot send messages: no model selected. Please select a model first.");
    }

    await this.getApiKeysLoadedPromise();
    const tools = await this.getTools();

    const stopWhenCondition: StopCondition<ToolSet> =
      this.modelConfig.maxSteps === undefined
        ? () => false
        : stepCountIs(this.modelConfig.maxSteps);

    const result = streamText({
      model: this.model,
      temperature: this.modelConfig.temperature,
      maxOutputTokens: this.modelConfig.maxTokens,
      topP: this.modelConfig.topP,
      topK: this.modelConfig.topK,
      frequencyPenalty: this.modelConfig.frequencyPenalty,
      presencePenalty: this.modelConfig.presencePenalty,
      seed: this.modelConfig.seed,
      messages: await convertToModelMessages(options.messages),
      abortSignal: options.abortSignal,
      tools,
      toolChoice: "auto",
      stopWhen: stopWhenCondition,
      // activeTools: [], // COMMENT OUT THIS LINE TO USE TOOLS
      system: this.getSystemPrompt(),
      ...(this.smoothStreamEnabled && {
        experimental_transform: smoothStream(),
      }),
      onError: (error) => {
        logger.error("Error occurred in CustomChatTransport streamText:", error);
      },
      onAbort: () => {
        logger.verbose("Stream aborted");
      },
    });

    let lastStepInputTokens = 0;
    let lastStepOutputTokens = 0;
    let accumulatedCostUsd = 0;

    return result.toUIMessageStream({
      messageMetadata: ({ part }) => {
        if (part.type !== "finish-step") {
          return undefined;
        }

        const usage = part.usage;
        const modelCost = getModelCostByChatModelId(this.modelId ?? undefined);
        const stepCostUsd = calculateCostUsdFromUsage(usage, modelCost);

        lastStepInputTokens = usage.inputTokens ?? 0;
        lastStepOutputTokens = usage.outputTokens ?? 0;
        accumulatedCostUsd += stepCostUsd;

        const metadata: ChatMessageMetadata = {
          modelId: this.modelId ?? undefined,
          inputTokens: lastStepInputTokens,
          outputTokens: lastStepOutputTokens,
          totalCostUsd: accumulatedCostUsd,
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
