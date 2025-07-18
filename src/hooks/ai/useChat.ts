import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import {
  type UIMessage,
  type UseChatOptions,
  useChat as useChatSDK,
} from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(model: LanguageModel, options?: CustomChatOptions) {
  const chatResult = useChatSDK({
    transport: new CustomChatTransport(model),
    maxSteps: 5,
    ...options,
  });

  return chatResult;
}
