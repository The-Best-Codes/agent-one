import type { LanguageModel } from "ai";
import { useAtomValue } from "jotai";
import React, { type ReactNode, useCallback, useMemo, useState } from "react";

import { googleModelsData } from "@/assets/model-lists/google-models";
import { groqModelsData } from "@/assets/model-lists/groq-models";
import { openRouterModelsData } from "@/assets/model-lists/openrouter-models";
import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { createGoogle } from "@/lib/ai/providers/google";
import { createGroqProvider } from "@/lib/ai/providers/groq";
import { createOpenRouterProvider } from "@/lib/ai/providers/openrouter";
import {
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
} from "@/lib/jotai/settings-atoms";

import { ModelContext } from "./model-contexts";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  model: LanguageModel;
  supportsToolUse: boolean;
}

export interface ModelContextType {
  currentModel: ModelConfig;
  setModel: (modelId: string) => void; // TODO: Rename this to setModelId?
  availableChatModels: ModelConfig[];
  getModelById: (id: string) => ModelConfig | undefined;
}

interface ModelProviderProps {
  children: ReactNode;
}

const getPartAfterSlash = (str: string) => {
  try {
    if (!str) return str;
    if (str.includes("/")) {
      const partAfterSlash = str.slice(str.indexOf("/") + 1);
      return partAfterSlash;
    }
    return str;
  } catch {
    return str;
  }
};

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const { getNewChatModelId, saveNewChatModelId } = usePersistence();

  const googleApiKey = useAtomValue(googleGenerativeAiApiKeyAtom);
  const groqApiKey = useAtomValue(groqApiKeyAtom);
  const openrouterApiKey = useAtomValue(openrouterApiKeyAtom);

  const googleProvider = useMemo(
    () => createGoogle(googleApiKey || undefined),
    [googleApiKey],
  );

  const groqProvider = useMemo(
    () => createGroqProvider(groqApiKey || undefined),
    [groqApiKey],
  );

  const openrouterProvider = useMemo(
    () => createOpenRouterProvider(openrouterApiKey || undefined),
    [openrouterApiKey],
  );

  const mapGoogleChatModels = useCallback(
    (): ModelConfig[] =>
      googleModelsData.models
        .filter((model: { supportedGenerationMethods: string[] }) =>
          model.supportedGenerationMethods.includes("generateContent"),
        )
        .map(
          (model: {
            name: string;
            displayName: string;
            supportedGenerationMethods: string[];
          }) => ({
            id: `google-${model.name}`,
            name: model.displayName,
            provider: "Google",
            model: googleProvider(model.name),
            supportsToolUse: true,
          }),
        ),
    [googleProvider],
  );

  const mapGroqChatModels = useCallback(
    (): ModelConfig[] =>
      groqModelsData.data
        .filter(
          (model: { id: string }) =>
            !model.id.includes("whisper") && !model.id.includes("tts"),
        )
        .map((model: { id: string }) => ({
          id: `groq-${model.id}`,
          name: getPartAfterSlash(model.id),
          provider: "Groq",
          model: groqProvider(model.id),
          supportsToolUse: true,
        })),
    [groqProvider],
  );

  const mapOpenRouterChatModels = useCallback(
    (): ModelConfig[] =>
      openRouterModelsData.data
        .filter(
          (model: {
            architecture: {
              output_modalities: string[];
              modality: string;
            };
          }) =>
            model.architecture.output_modalities.includes("text") &&
            !model.architecture.modality.endsWith("image"),
        )
        .map(
          (model: {
            id: string;
            name: string;
            supported_parameters: string[];
          }) => ({
            id: `openrouter-${model.id}`,
            name: model.name,
            provider: "OpenRouter",
            model: openrouterProvider(model.id),
            supportsToolUse: (model.supported_parameters as string[]).includes(
              "tools",
            ),
          }),
        ),
    [openrouterProvider],
  );

  const availableChatModels = useMemo(
    () => [
      ...mapGoogleChatModels(),
      ...mapGroqChatModels(),
      ...mapOpenRouterChatModels(),
    ],
    [mapGoogleChatModels, mapGroqChatModels, mapOpenRouterChatModels],
  );

  const getModelByIdFn = useCallback(
    (id: string): ModelConfig | undefined => {
      return availableChatModels.find((model) => model.id === id);
    },
    [availableChatModels],
  );

  const getDefaultChatModel = useCallback((): ModelConfig => {
    const defaultId = "groq-moonshotai/kimi-k2-instruct-0905";
    return getModelByIdFn(defaultId) || availableChatModels[0];
  }, [getModelByIdFn, availableChatModels]);

  const [currentModel, setCurrentModel] = useState<ModelConfig>(() => {
    const savedModelId = getNewChatModelId();
    if (savedModelId) {
      const savedModel = getModelByIdFn(savedModelId);
      if (savedModel) {
        return savedModel;
      }
    }
    return getDefaultChatModel();
  });

  const setModel = useCallback(
    (modelId: string) => {
      const model = getModelByIdFn(modelId);
      if (model) {
        setCurrentModel(model);
        saveNewChatModelId(modelId);
      }
    },
    [getModelByIdFn, saveNewChatModelId],
  );

  return (
    <ModelContext.Provider
      value={{
        currentModel,
        setModel,
        availableChatModels,
        getModelById: getModelByIdFn,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};
