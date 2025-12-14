import {
  type UIMessage,
  useChat as useChatSDK,
  type UseChatOptions,
} from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { useTools } from "@/contexts/use-tools/tools-hooks";
import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { type ModelConfig } from "@/lib/ai/models";
import { systemPromptAtom } from "@/lib/jotai/atoms";
import { smoothStreamEnabledAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(
  model: LanguageModel,
  modelConfig: ModelConfig,
  options?: CustomChatOptions,
) {
  const smoothStreamEnabled = useAtomValue(smoothStreamEnabledAtom);
  const systemPrompt = useAtomValue(systemPromptAtom);
  const { getTools } = useTools();
  const getSystemPrompt = useCallback(() => systemPrompt, [systemPrompt]);
  const [transport] = useState(
    () =>
      new CustomChatTransport(
        model,
        modelConfig,
        smoothStreamEnabled,
        getTools,
        getSystemPrompt,
      ),
  );

  useEffect(() => {
    transport.updateModel(model);
    logger.verbose("Updated chat transport with new model:", model);
  }, [model, transport]);

  useEffect(() => {
    transport.updateModelConfig(modelConfig);
    logger.verbose("Updated chat transport with new config");
  }, [modelConfig, transport]);

  useEffect(() => {
    transport.updateSmoothStreamEnabled(smoothStreamEnabled);
    logger.verbose("Updated chat transport with new settings");
  }, [smoothStreamEnabled, transport]);

  useEffect(() => {
    transport.updateSystemPrompt(getSystemPrompt);
    logger.verbose("Updated chat transport with new system prompt");
  }, [getSystemPrompt, transport]);

  const chatResult = useChatSDK({
    transport: transport,
    ...options,
  });

  return chatResult;
}
