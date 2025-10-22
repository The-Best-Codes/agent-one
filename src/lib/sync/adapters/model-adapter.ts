import type { ModelConfig } from "@/lib/ai/models";

import type { SyncAdapterConfig } from "../core/types";
import { createAdapter } from "./create-adapter";

export interface ModelSyncPayload {
  modelId: string;
  config: ModelConfig;
}

export interface ModelContext {
  setModel: (modelId: string) => void;
  getModel: () => ModelConfig | null;
}

export function createModelAdapter(): ReturnType<
  typeof createAdapter<ModelSyncPayload, ModelContext>
> {
  const config: SyncAdapterConfig<ModelSyncPayload, ModelContext> = {
    entityType: "model",
    selector: () => {
      return {
        modelId: "",
        config: {} as ModelConfig,
      };
    },
    onRemoteChange: async (payload, modelContext) => {
      if (payload.modelId) {
        modelContext.setModel(payload.modelId);
      }
    },
    conflictResolution: "last-write-wins",
  };

  return createAdapter(config);
}
