import {
  type UIMessage,
  useChat as useChatSDK,
  type UseChatOptions,
} from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { smoothStreamEnabledAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(model: LanguageModel, options?: CustomChatOptions) {
  const smoothStreamEnabled = useAtomValue(smoothStreamEnabledAtom);
  const [transport] = useState(
    () => new CustomChatTransport(model, smoothStreamEnabled),
  );

  useEffect(() => {
    transport.updateModel(model);
    logger.verbose("Updated chat transport with new model:", model);
  }, [model, transport]);

  useEffect(() => {
    transport.updateSmoothStreamEnabled(smoothStreamEnabled);
    logger.verbose("Updated chat transport with new settings");
  }, [smoothStreamEnabled, transport]);

  const chatResult = useChatSDK({
    transport: transport,
    ...options,
  });

  return chatResult;
}
