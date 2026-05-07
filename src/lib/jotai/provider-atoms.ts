import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import {
  normalizeProviderModelMetadata,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";
import { PROVIDER_REGISTRY, type ProviderId } from "@/lib/ai/providers/registry";

import { normalizedCustomProvidersAtom } from "./custom-provider-atoms";
import { SETTING_PREFIX } from "./settings-atoms";

export type { ProviderId } from "@/lib/ai/providers/registry";

export interface ProviderConfig {
  enabled: boolean;
  headers: Record<string, string>;
  models: ProviderModelMetadata[];
}

const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  enabled: false,
  headers: {},
  models: [],
};

function createProviderConfigAtom(providerId: ProviderId) {
  const key = `${SETTING_PREFIX}PROVIDER_CONFIG_${providerId.toUpperCase()}`;
  return atomWithStorage<ProviderConfig>(key, DEFAULT_PROVIDER_CONFIG, undefined, {
    getOnInit: true,
  });
}

type ProviderConfigAtom = ReturnType<typeof createProviderConfigAtom>;

export const providerConfigAtoms = Object.fromEntries(
  PROVIDER_REGISTRY.map((provider) => [provider.id, createProviderConfigAtom(provider.id)]),
) as Record<ProviderId, ProviderConfigAtom>;

export const allProviderConfigsAtom = atom((get) => {
  return Object.fromEntries(
    PROVIDER_REGISTRY.map((p) => {
      const config = get(providerConfigAtoms[p.id]);
      return [
        p.id,
        {
          ...config,
          models: (config.models ?? []).map(normalizeProviderModelMetadata),
        },
      ];
    }),
  ) as Record<ProviderId, ProviderConfig>;
});

export function getProviderConfigAtom(providerId: ProviderId) {
  return providerConfigAtoms[providerId];
}

export const hasEnabledProviderAtom = atom((get) => {
  const builtInEnabled = PROVIDER_REGISTRY.some(
    (p) => get(providerConfigAtoms[p.id as ProviderId]).enabled,
  );
  if (builtInEnabled) return true;
  return get(normalizedCustomProvidersAtom).some((p) => p.enabled);
});
