import { type UIMessage, useChat as useChatSDK, type UseChatOptions } from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";
import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { systemPromptAtom } from "@/lib/jotai/atoms";
import { extractReasoningEnabledAtom, smoothStreamEnabledAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "experimental_throttle" | "resume">;

export function useChat(
  model: LanguageModel | null,
  modelId: string | null,
  modelConfig: ModelConfig,
  options?: CustomChatOptions,
) {
  const smoothStreamEnabled = useAtomValue(smoothStreamEnabledAtom);
  const extractReasoningEnabled = useAtomValue(extractReasoningEnabledAtom);
  const systemPrompt = useAtomValue(systemPromptAtom);
  const { getApiKeysLoadedPromise } = useApiKeys();
  const { getTools } = useTools();
  const getSystemPrompt = useCallback(() => systemPrompt, [systemPrompt]);
  const [transport] = useState(
    () =>
      new CustomChatTransport(
        model,
        modelId,
        modelConfig,
        smoothStreamEnabled,
        extractReasoningEnabled,
        getTools,
        getSystemPrompt,
        getApiKeysLoadedPromise,
      ),
  );

  useEffect(() => {
    transport.updateModel(model);
    logger.verbose(
      "Updated chat transport with new model:",
      typeof model === "string" ? model : model?.modelId,
    );
  }, [model, transport]);

  useEffect(() => {
    transport.updateModelId(modelId);
    logger.verbose("Updated chat transport with new model id:", modelId);
  }, [modelId, transport]);

  useEffect(() => {
    transport.updateModelConfig(modelConfig);
    logger.verbose("Updated chat transport with new config");
  }, [modelConfig, transport]);

  useEffect(() => {
    transport.updateSmoothStreamEnabled(smoothStreamEnabled);
    logger.verbose("Updated chat transport with new settings");
  }, [smoothStreamEnabled, transport]);

  useEffect(() => {
    transport.updateExtractReasoningEnabled(extractReasoningEnabled);
    logger.verbose(
      "Updated chat transport with extract reasoning setting:",
      extractReasoningEnabled,
    );
  }, [extractReasoningEnabled, transport]);

  useEffect(() => {
    transport.updateSystemPrompt(getSystemPrompt);
    logger.verbose("Updated chat transport with new system prompt");
  }, [getSystemPrompt, transport]);

  useEffect(() => {
    transport.updateGetApiKeysLoadedPromise(getApiKeysLoadedPromise);
    logger.verbose("Updated chat transport with new API keys loaded promise");
  }, [getApiKeysLoadedPromise, transport]);

  const chatResult = useChatSDK({
    transport,
    ...options,
  });

  const syncTransport = useCallback(() => {
    transport.updateModel(model);
    transport.updateModelId(modelId);
    transport.updateModelConfig(modelConfig);
    transport.updateSmoothStreamEnabled(smoothStreamEnabled);
    transport.updateExtractReasoningEnabled(extractReasoningEnabled);
  }, [model, modelId, modelConfig, smoothStreamEnabled, extractReasoningEnabled, transport]);

  const sendMessage = useCallback<typeof chatResult.sendMessage>(
    async (message, sendOptions) => {
      syncTransport();
      return chatResult.sendMessage(message, sendOptions);
    },
    [chatResult, syncTransport],
  );

  const regenerate = useCallback<typeof chatResult.regenerate>(
    async (regenerateOptions) => {
      syncTransport();
      return chatResult.regenerate(regenerateOptions);
    },
    [chatResult, syncTransport],
  );

  return {
    ...chatResult,
    sendMessage,
    regenerate,
  };
}
