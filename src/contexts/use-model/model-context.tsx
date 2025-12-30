import React, { type ReactNode, useCallback, useState } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { type ModelConfig, type ModelData } from "@/lib/ai/models";

import { ModelContext } from "./model-contexts";

export interface ModelContextType {
  currentModel: ModelData;
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
  const { getModelById, getDefaultChatModel } = useModelCatalog();

  const [currentModel, setCurrentModel] = useState<ModelData>(() => {
    const savedModelId = getNewChatModelId();
    if (savedModelId) {
      const savedModel = getModelById(savedModelId);
      if (savedModel) {
        return savedModel;
      }
    }
    return getDefaultChatModel();
  });

  const [currentModelConfig, setCurrentModelConfig] = useState<ModelConfig>(
    () => {
      return getNewChatModelConfig();
    },
  );

  const setModel = useCallback(
    (modelId: string) => {
      const model = getModelById(modelId);
      if (model) {
        setCurrentModel(model);
        saveNewChatModelId(modelId);
      }
    },
    [saveNewChatModelId, getModelById],
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
