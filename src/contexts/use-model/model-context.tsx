import React, { type ReactNode, useCallback, useState } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
import {
  getDefaultChatModel,
  getModelById,
  type ModelData,
} from "@/lib/ai/models";

import { ModelContext } from "./model-contexts";

export interface ModelContextType {
  currentModel: ModelData;
  setModel: (modelId: string) => void;
}

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const { getNewChatModelId, saveNewChatModelId } = usePersistence();

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

  const setModel = useCallback(
    (modelId: string) => {
      const model = getModelById(modelId);
      if (model) {
        setCurrentModel(model);
        saveNewChatModelId(modelId);
      }
    },
    [saveNewChatModelId],
  );

  return (
    <ModelContext.Provider value={{ currentModel, setModel }}>
      {children}
    </ModelContext.Provider>
  );
};
