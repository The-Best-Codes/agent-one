import { type UIMessage } from "@ai-sdk/react";
import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  type LanguageModel,
  smoothStream,
  streamText,
  type ToolSet,
  type UIMessageChunk,
} from "ai";

import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private model: LanguageModel;
  private modelConfig: ModelConfig;
  private smoothStreamEnabled: boolean;
  private getTools: () => Promise<ToolSet>;
  private getSystemPrompt: () => string;
  private getApiKeysLoadedPromise: () => Promise<void>;

  constructor(
    model: LanguageModel,
    modelConfig: ModelConfig,
    smoothStreamEnabled: boolean,
    getTools: () => Promise<ToolSet>,
    getSystemPrompt: () => string,
    getApiKeysLoadedPromise: () => Promise<void>,
  ) {
    this.model = model;
    this.modelConfig = modelConfig;
    this.smoothStreamEnabled = smoothStreamEnabled;
    this.getTools = getTools;
    this.getSystemPrompt = getSystemPrompt;
    this.getApiKeysLoadedPromise = getApiKeysLoadedPromise;
  }

  updateModel(model: LanguageModel) {
    this.model = model;
    logger.verbose("CustomChatTransport model updated to:", model);
  }

  updateModelConfig(config: ModelConfig) {
    this.modelConfig = config;
    logger.verbose("CustomChatTransport config updated");
  }

  updateSmoothStreamEnabled(smoothStreamEnabled: boolean) {
    this.smoothStreamEnabled = smoothStreamEnabled;
    logger.verbose(
      "CustomChatTransport smoothStreamEnabled updated to:",
      smoothStreamEnabled,
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
    await this.getApiKeysLoadedPromise();
    const tools = await this.getTools();

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
      // activeTools: [], // COMMENT OUT THIS LINE TO USE TOOLS
      system: this.getSystemPrompt(),
      ...(this.smoothStreamEnabled && {
        experimental_transform: smoothStream(),
      }),
      onError: (error) => {
        logger.error(
          "Error occurred in CustomChatTransport streamText:",
          error,
        );
      },
      onAbort: () => {
        logger.verbose("Stream aborted");
      },
    });

    return result.toUIMessageStream({
      onError: (error) => {
        logger.error(
          "Error occurred in CustomChatTransport toUIMessageStream:",
          error,
        );

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
