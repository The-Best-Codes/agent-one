import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { getLogger } from "@/lib/logger";
import {
  type UIMessage,
  type UseChatOptions,
  useChat as useChatSDK,
} from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useEffect, useRef } from "react";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(model: LanguageModel, options?: CustomChatOptions) {
  const transportRef = useRef<CustomChatTransport | null>(null);

  if (!transportRef.current) {
    transportRef.current = new CustomChatTransport(model);
  }

  useEffect(() => {
    if (transportRef.current) {
      transportRef.current.updateModel(model);
      logger.verbose("Updated chat transport with new model:", model);
    }
  }, [model]);

  const chatResult = useChatSDK({
    transport: transportRef.current,
    ...options,
  });

  return chatResult;
}
