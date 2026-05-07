import { atom } from "jotai";
import { atomFamily, atomWithStorage } from "jotai/utils";

import {
  normalizeProviderModelMetadata,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";
import { PROVIDER_REGISTRY, type ProviderId } from "@/lib/ai/providers/registry";

import { hasEnabledCustomProviderAtom } from "./custom-provider-atoms";
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

function normalizeProviderConfig(config: Partial<ProviderConfig> | undefined): ProviderConfig {
  return {
    enabled: config?.enabled ?? DEFAULT_PROVIDER_CONFIG.enabled,
    headers: config?.headers ?? DEFAULT_PROVIDER_CONFIG.headers,
    models: (config?.models ?? DEFAULT_PROVIDER_CONFIG.models).map(normalizeProviderModelMetadata),
  };
}

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

export function getProviderConfigAtom(providerId: ProviderId) {
  return providerConfigAtoms[providerId];
}

export const providerEnabledAtomFamily = atomFamily((providerId: ProviderId) =>
  atom((get) => normalizeProviderConfig(get(providerConfigAtoms[providerId])).enabled),
);

export const providerHeadersAtomFamily = atomFamily((providerId: ProviderId) =>
  atom((get) => normalizeProviderConfig(get(providerConfigAtoms[providerId])).headers),
);

export const providerModelsAtomFamily = atomFamily((providerId: ProviderId) =>
  atom((get) => normalizeProviderConfig(get(providerConfigAtoms[providerId])).models),
);

export const hasEnabledProviderAtom = atom((get) => {
  const builtInEnabled = PROVIDER_REGISTRY.some(
    (p) => get(providerConfigAtoms[p.id as ProviderId]).enabled,
  );
  if (builtInEnabled) return true;
  return get(hasEnabledCustomProviderAtom);
});
