import React, { type ReactNode, useCallback, useEffect, useState } from "react";

import { usePersistence } from "@/contexts/use-persistence/persistence-hooks";
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
  const { getNewChatModelId, saveNewChatModelId } = usePersistence();

  const [currentModel, setCurrentModel] =
    useState<ModelConfig>(getDefaultModel());

  useEffect(() => {
    const loadModel = async () => {
      const savedModelId = await getNewChatModelId();
      if (savedModelId) {
        const savedModel = getModelById(savedModelId);
        if (savedModel) {
          setCurrentModel(savedModel);
          return;
        }
      }
      setCurrentModel(getDefaultModel());
    };
    loadModel();
  }, [getNewChatModelId]);

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
