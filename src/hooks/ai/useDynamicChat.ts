import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import {
  type UIMessage,
  type UseChatOptions,
  useChat as useChatSDK,
} from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useRef, useEffect } from "react";

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useDynamicChat(model: LanguageModel, options?: CustomChatOptions) {
  const transportRef = useRef<CustomChatTransport | null>(null);
  
  // Initialize transport if it doesn't exist
  if (!transportRef.current) {
    transportRef.current = new CustomChatTransport(model);
  }
  
  // Update the transport's model when the model changes
  useEffect(() => {
    if (transportRef.current) {
      transportRef.current.updateModel(model);
      console.log('Updated chat transport with new model:', model);
    }
  }, [model]);

  const chatResult = useChatSDK({
    transport: transportRef.current,
    ...options,
  });

  return chatResult;
}