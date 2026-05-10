import { getDefaultStore } from "jotai";
import { useEffect } from "react";

import { fetchProviderModels } from "@/lib/ai/providers/custom-provider-factory";
import {
  normalizedLocalProvidersAtom,
  updateLocalProviderAtom,
} from "@/lib/jotai/local-provider-atoms";

const store = getDefaultStore();

export function LocalProviderStartupSync() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const providers = store.get(normalizedLocalProvidersAtom);

      for (const provider of providers) {
        try {
          const response = await fetchProviderModels(provider.baseUrl, undefined, provider.headers);
          if (cancelled) {
            return;
          }

          const existingModels = new Map(provider.models.map((model) => [model.id, model]));
          const fetchedModels = response.data.map((model) => {
            const existingModel = existingModels.get(model.id);

            return (
              existingModel ?? {
                id: model.id,
                supportsText: true,
                supportsTools: true,
                supportsImages: false,
              }
            );
          });

          const extraModels = provider.models.filter(
            (model) => !fetchedModels.some((item) => item.id === model.id),
          );

          store.set(updateLocalProviderAtom, provider.id, {
            models: [...fetchedModels, ...extraModels],
          });
        } catch {
          if (cancelled) {
            return;
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
