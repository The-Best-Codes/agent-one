import React, { type ReactNode, useCallback, useMemo, useState } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { type ModelConfig, type ModelData } from "@/hooks/ai/use-model-catalog";

import { ModelContext } from "./model-contexts";

export interface ModelContextType {
  currentModel: ModelData | undefined;
  setModel: (modelId: string) => void;
  currentModelConfig: ModelConfig;
  setModelConfig: (config: ModelConfig) => void;
}

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const {
    getNewChatModelId,
    saveNewChatModelId,
    getNewChatModelConfig,
    saveNewChatModelConfig,
  } = usePersistence();
  const { getChatModelById, getSmartDefaultChatModel } = useModelCatalog();

  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    () => getNewChatModelId() ?? undefined,
  );

  const currentModel = useMemo(() => {
    if (selectedModelId) {
      const model = getChatModelById(selectedModelId);
      if (model) {
        return model;
      }
    }
    return getSmartDefaultChatModel();
  }, [selectedModelId, getChatModelById, getSmartDefaultChatModel]);

  const [currentModelConfig, setCurrentModelConfig] = useState<ModelConfig>(
    () => {
      return getNewChatModelConfig();
    },
  );

  const setModel = useCallback(
    (modelId: string) => {
      const model = getChatModelById(modelId);
      if (model) {
        setSelectedModelId(modelId);
        saveNewChatModelId(modelId);
      }
    },
    [saveNewChatModelId, getChatModelById],
  );

  const setModelConfig = useCallback(
    (config: ModelConfig) => {
      setCurrentModelConfig(config);
      saveNewChatModelConfig(config);
    },
    [saveNewChatModelConfig],
  );

  return (
    <ModelContext.Provider
      value={{ currentModel, setModel, currentModelConfig, setModelConfig }}
    >
      {children}
    </ModelContext.Provider>
  );
};
