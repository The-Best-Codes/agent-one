import { getDefaultStore } from "jotai";
import { useEffect } from "react";

import { fetchProviderModelMetadata } from "@/lib/ai/providers/custom-provider-factory";
import {
  normalizedLocalProvidersAtom,
  updateLocalProviderAtom,
} from "@/lib/jotai/local-provider-atoms";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

const store = getDefaultStore();

export function LocalProviderStartupSync() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const providers = store.get(normalizedLocalProvidersAtom);

      for (const provider of providers) {
        try {
          const response = await fetchProviderModelMetadata(
            provider.baseUrl,
            undefined,
            provider.headers,
            provider.id,
          );
          if (cancelled) {
            return;
          }

          const existingModels = new Map(provider.models.map((model) => [model.id, model]));
          const fetchedModels = response.map((model) => existingModels.get(model.id) ?? model);

          const extraModels = provider.models.filter(
            (model) => !fetchedModels.some((item) => item.id === model.id),
          );

          store.set(updateLocalProviderAtom, provider.id, {
            models: [...fetchedModels, ...extraModels],
          });
        } catch (error) {
          if (cancelled) {
            return;
          }
          logger.warn(`Failed to refresh models for local provider ${provider.id}`, error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
