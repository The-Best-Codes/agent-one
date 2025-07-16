import { customFetch as sharedCustomFetch } from "@/lib/ai/customFetch";
import {
  type UIMessage,
  type UseChatOptions,
  useChat as useChatSDK,
} from "@ai-sdk/react";
import { type ChatInit, DefaultChatTransport, type LanguageModel } from "ai";

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(model: LanguageModel, options?: CustomChatOptions) {
  const fetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
    return sharedCustomFetch(input, model, init);
  };

  const chatResult = useChatSDK({
    transport: new DefaultChatTransport({
      fetch: fetcher,
    }),
    ...options,
  });

  return chatResult;
}
