import { type UIMessage } from "@ai-sdk/react";
import {
  type ChatRequestOptions,
  type ChatTransport,
  convertToModelMessages,
  type LanguageModel,
  smoothStream,
  streamText,
  type UIMessageChunk,
} from "ai";

import { getLogger } from "@/lib/logger";
import type { SettingsType } from "@/lib/settings/types";

import { SYSTEM_PROMPT } from "./system-prompt";
import { getToolsObject } from "./tools";

const logger = getLogger(import.meta.url);

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private model: LanguageModel;
  private settings: SettingsType;

  constructor(model: LanguageModel, settings: SettingsType) {
    this.model = model;
    this.settings = settings;
  }

  updateModel(model: LanguageModel) {
    this.model = model;
    logger.verbose("CustomChatTransport model updated to:", model);
  }

  updateSettings(settings: SettingsType) {
    this.settings = settings;
    logger.verbose("CustomChatTransport settings updated");
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
    const tools = await getToolsObject();

    const result = streamText({
      model: this.model,
      messages: convertToModelMessages(options.messages),
      abortSignal: options.abortSignal,
      tools,
      toolChoice: "auto",
      // activeTools: [], // COMMENT OUT THIS LINE TO USE TOOLS
      system: SYSTEM_PROMPT,
      ...(this.settings.SMOOTH_STREAM_ENABLED.value && {
        experimental_transform: smoothStream(),
      }),
      onError: (error) => {
        logger.error(
          "Error occurred in CustomChatTransport streamText:",
          error,
        );
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
