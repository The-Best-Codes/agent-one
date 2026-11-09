import { type UIMessage, useChat as useChatSDK, type UseChatOptions } from "@ai-sdk/react";
import { type ChatInit, type LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useTools } from "@/contexts/use-tools/tools-hooks";
import { type ModelConfig, useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { CustomChatTransport } from "@/lib/ai/custom-chat-transport";
import { FILE_KINDS, type FileKind } from "@/lib/attachments";
import { systemPromptAtom } from "@/lib/jotai/atoms";
import { settingAtoms } from "@/lib/jotai/settings-atoms";
import { getLogger } from "@/lib/logger";
import { getProject } from "@/lib/projects";

const logger = getLogger(import.meta.url);

type CustomChatOptions = Omit<ChatInit<UIMessage>, "transport"> &
  Pick<UseChatOptions<UIMessage>, "resume" | "throttle"> & {
    onUserMessageSent?: () => void;
  };

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
  providerName: string | null,
  modelConfig: ModelConfig,
  contextWindow: number | undefined,
  options?: CustomChatOptions,
) {
  const extractReasoningEnabled = useAtomValue(settingAtoms.EXTRACT_REASONING_ENABLED);
  const autoModeModelId = useAtomValue(settingAtoms.AUTO_MODE_MODEL);
  const { getChatModelById } = useModelCatalog();
  const autoModeModelData = autoModeModelId ? getChatModelById(autoModeModelId) : undefined;
  const autoModeModel = useMemo(
    () => autoModeModelData?.getLanguageModel() ?? null,
    [autoModeModelData],
  );
  const analyzeFileModelIds = useAtomValue(settingAtoms.FILE_ANALYSIS_MODELS);
  const analyzeFileModels = useMemo(() => {
    const ids =
      analyzeFileModelIds && typeof analyzeFileModelIds === "object" ? analyzeFileModelIds : {};
    return Object.fromEntries(
      FILE_KINDS.flatMap((kind) => {
        const id = ids[kind];
        const languageModel =
          typeof id === "string" && id ? getChatModelById(id)?.getLanguageModel() : undefined;
        return languageModel ? [[kind, languageModel]] : [];
      }),
    ) as Partial<Record<FileKind, LanguageModel>>;
  }, [analyzeFileModelIds, getChatModelById]);
  const getSystemPrompt = useAtomValue(systemPromptAtom);
  const { getApiKeysLoadedPromise } = useApiKeys();
  const { getTools } = useTools();
  const { loadChatMetadata } = usePersistence();
  const getChatProject = useCallback(
    (chatId: string) => getProject(loadChatMetadata(chatId).projectId),
    [loadChatMetadata],
  );
  const [transport] = useState(
    () =>
      new CustomChatTransport(
        model,
        modelId,
        providerName,
        modelConfig,
        extractReasoningEnabled,
        getTools,
        getSystemPrompt,
        getChatProject,
        getApiKeysLoadedPromise,
      ),
  );

  useEffect(() => {
    transport.updateModel(model, providerName);
    logger.verbose(
      "Updated chat transport with new model:",
      typeof model === "string" ? model : model?.modelId,
    );
  }, [model, providerName, transport]);

  useEffect(() => {
    transport.updateAutoModeModel(autoModeModel);
  }, [autoModeModel, transport]);

  useEffect(() => {
    transport.updateAnalyzeFileModels(analyzeFileModels);
  }, [analyzeFileModels, transport]);

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

  const { onUserMessageSent, ...sdkOptions } = options ?? {};

  useEffect(() => {
    transport.updateContextWindow(contextWindow);
  }, [contextWindow, transport]);

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
    ...sdkOptions,
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const syncTransport = useCallback(() => {
    transport.updateModel(model, providerName);
    transport.updateAutoModeModel(autoModeModel);
    transport.updateAnalyzeFileModels(analyzeFileModels);
    transport.updateModelId(modelId);
    transport.updateModelConfig(modelConfig);
    transport.updateContextWindow(contextWindow);
    transport.updateExtractReasoningEnabled(extractReasoningEnabled);
  }, [
    model,
    autoModeModel,
    analyzeFileModels,
    modelId,
    providerName,
    modelConfig,
    contextWindow,
    extractReasoningEnabled,
    transport,
  ]);

  const sendMessage = useCallback<typeof sendMessageSdk>(
    async (message, sendOptions) => {
      syncTransport();
      const result = sendMessageSdk(message, sendOptions);
      if (message !== undefined) {
        onUserMessageSent?.();
      }
      return result;
    },
    [sendMessageSdk, syncTransport, onUserMessageSent],
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

  const compact = useCallback(async () => {
    syncTransport();
    return sendMessageSdk(undefined, { body: { compact: true } });
  }, [sendMessageSdk, syncTransport]);

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
    compact,
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
