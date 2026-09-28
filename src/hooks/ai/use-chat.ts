import { type UIMessage, useChat as useChatSDK, type UseChatOptions } from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";
import { type ModelConfig } from "@/hooks/ai/use-model-catalog";
import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { systemPromptAtom } from "@/lib/jotai/atoms";
import { extractReasoningEnabledAtom } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "resume" | "throttle">;

function canResumeFromMessages(messages: UIMessage[]) {
  const lastMessage = messages.at(-1);

  if (!lastMessage) {
    return false;
  }

  return lastMessage.role === "assistant" || lastMessage.role === "user";
}

export function useChat(
  model: LanguageModel | null,
  modelId: string | null,
  modelConfig: ModelConfig,
  options?: CustomChatOptions,
) {
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

  const {
    addToolApprovalResponse,
    addToolOutput,
    clearError,
    error,
    messages,
    regenerate: regenerateSdk,
    resumeStream: resumeStreamSdk,
    sendMessage: sendMessageSdk,
    setMessages,
    status,
    stop,
  } = useChatSDK({
    transport,
    ...options,
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const syncTransport = useCallback(() => {
    transport.updateModel(model);
    transport.updateModelId(modelId);
    transport.updateModelConfig(modelConfig);
    transport.updateExtractReasoningEnabled(extractReasoningEnabled);
  }, [model, modelId, modelConfig, extractReasoningEnabled, transport]);

  const sendMessage = useCallback<typeof sendMessageSdk>(
    async (message, sendOptions) => {
      syncTransport();
      return sendMessageSdk(message, sendOptions);
    },
    [sendMessageSdk, syncTransport],
  );

  const regenerate = useCallback<typeof regenerateSdk>(
    async (regenerateOptions) => {
      syncTransport();
      return regenerateSdk(regenerateOptions);
    },
    [regenerateSdk, syncTransport],
  );

  const resumeStream = useCallback<typeof resumeStreamSdk>(
    async (resumeOptions) => {
      syncTransport();

      if (canResumeFromMessages(messagesRef.current)) {
        return sendMessageSdk(undefined, resumeOptions);
      }

      return resumeStreamSdk(resumeOptions);
    },
    [resumeStreamSdk, sendMessageSdk, syncTransport],
  );

  const updateMcpAppModelContext = useCallback(
    (viewId: string, context: unknown) => {
      transport.updateMcpAppModelContext(viewId, context);
    },
    [transport],
  );

  return {
    addToolApprovalResponse,
    addToolOutput,
    clearError,
    error,
    messages,
    regenerate,
    resumeStream,
    sendMessage,
    setMessages,
    status,
    stop,
    updateMcpAppModelContext,
  };
}
