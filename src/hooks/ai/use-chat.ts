import {
  type UIMessage,
  useChat as useChatSDK,
  type UseChatOptions,
} from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useEffect, useState } from "react";

import { useSettings } from "@/contexts/use-settings/settings-hooks";
import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(model: LanguageModel, options?: CustomChatOptions) {
  const { settings } = useSettings();
  const [transport] = useState(() => new CustomChatTransport(model, settings));

  useEffect(() => {
    transport.updateModel(model);
    logger.verbose("Updated chat transport with new model:", model);
  }, [model, transport]);

  useEffect(() => {
    transport.updateSettings(settings);
    logger.verbose("Updated chat transport with new settings");
  }, [settings, transport]);

  const chatResult = useChatSDK({
    transport: transport,
    ...options,
  });

  return chatResult;
}
