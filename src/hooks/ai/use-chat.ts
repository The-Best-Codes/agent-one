import {
  type UIMessage,
  useChat as useChatSDK,
  type UseChatOptions,
} from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useEffect, useRef } from "react";

import { useSettings } from "@/contexts/use-settings/settings-hooks";
import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(model: LanguageModel, options?: CustomChatOptions) {
  const { settings } = useSettings();
  const transportRef = useRef<CustomChatTransport | null>(null);

  if (!transportRef.current) {
    transportRef.current = new CustomChatTransport(model, settings);
  }

  useEffect(() => {
    if (transportRef.current) {
      transportRef.current.updateModel(model);
      logger.verbose("Updated chat transport with new model:", model);
    }
  }, [model]);

  useEffect(() => {
    if (transportRef.current) {
      transportRef.current.updateSettings(settings);
      logger.verbose("Updated chat transport with new settings");
    }
  }, [settings]);

  const chatResult = useChatSDK({
    transport: transportRef.current,
    ...options,
  });

  return chatResult;
}
