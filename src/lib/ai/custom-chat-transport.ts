import { type UIMessage } from "@ai-sdk/react";
import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  type LanguageModel,
  // smoothStream,
  // stepCountIs,
  streamText,
  type UIMessageChunk,
} from "ai";

import { getLogger } from "@/lib/logger";

import { SYSTEM_PROMPT } from "./system-prompt";
import { toolsObject } from "./tools";

const logger = getLogger(import.meta.url);

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  updateModel(model: LanguageModel) {
    this.model = model;
    logger.verbose("CustomChatTransport model updated to:", model);
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
    const result = streamText({
      model: this.model,
      messages: convertToModelMessages(options.messages),
      abortSignal: options.abortSignal,
      tools: toolsObject,
      toolChoice: "auto",
      //activeTools: [], // COMMENT OUT THIS LINE TO USE TOOLS
      system: SYSTEM_PROMPT,
      // stopWhen: stepCountIs(50), // TODO: [TODO: Investigate if this is relevant in AI SDK 5] Allow the user to configure this in settings
      // experimental_transform: smoothStream(), // TODO: Allow customizing this in settings
    });

    return result.toUIMessageStream({
      onError: (error) => {
        logger.error("Error occurred in CustomChatTransport:", error);

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
