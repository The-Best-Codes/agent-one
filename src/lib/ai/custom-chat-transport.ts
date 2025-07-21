import { type UIMessage } from "@ai-sdk/react";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type ChatRequestOptions,
  type ChatTransport,
  type LanguageModel,
  type UIMessageChunk,
} from "ai";
import { SYSTEM_PROMPT } from "./system-prompt";
import { toolsObject } from "./tools";

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private model: LanguageModel;

  constructor(model: LanguageModel) {
    this.model = model;
  }

  async sendMessages(
    options: {
      chatId: string;
      messages: UIMessage[];
      abortSignal: AbortSignal | undefined;
    } & {
      trigger:
        | "submit-user-message"
        | "submit-tool-result"
        | "regenerate-assistant-message";
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
      // TODO: Move max step count to settings or some kind of config for the user
      stopWhen: stepCountIs(50),
    });
    return result.toUIMessageStream({
      onError: (error) => {
        console.error("Error occurred in CustomChatTransport:", error);

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
    console.warn(
      "resumeStream is not implemented in frontend-only applications. Please don't use it.",
    );
    return null;
  }
}
