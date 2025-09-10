import React, { type ReactNode, useCallback, useState } from "react";

import {
  getDefaultModel,
  getModelById,
  type ModelConfig,
} from "@/lib/ai/models";
import { getNewChatModelId, saveNewChatModelId } from "@/lib/ai/persistence";

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
    const savedModelId = getNewChatModelId();
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
      saveNewChatModelId(modelId);
    }
  }, []);

  return (
    <ModelContext.Provider value={{ currentModel, setModel }}>
      {children}
    </ModelContext.Provider>
  );
};
