import React, { type ReactNode, useCallback, useState } from "react";

import {
  getDefaultModel,
  getModelById,
  type ModelConfig,
} from "@/lib/ai/models";

import { ModelContext } from "./model-contexts";

export interface ModelContextType {
  currentModel: ModelConfig;
  setModel: (modelId: string) => void;
}

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [currentModel, setCurrentModel] = useState<ModelConfig>(() => {
    // Try to load from localStorage, fallback to default
    const savedModelId = localStorage.getItem("selected-model-id");
    if (savedModelId) {
      const savedModel = getModelById(savedModelId);
      if (savedModel) {
        return savedModel;
      }
    }
    return getDefaultModel();
  });

  const setModel = useCallback((modelId: string) => {
    const model = getModelById(modelId);
    if (model) {
      setCurrentModel(model);
      localStorage.setItem("selected-model-id", modelId);
    }
  }, []);

  return (
    <ModelContext.Provider value={{ currentModel, setModel }}>
      {children}
    </ModelContext.Provider>
  );
};
