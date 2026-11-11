import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

import {
  normalizeProviderModelMetadata,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";
import { PROVIDER_REGISTRY, type ProviderId } from "@/lib/ai/providers/registry";
import { createEncryptedSyncGroup } from "@/lib/sync/encrypted-sync-manager";

import { hasEnabledCustomProviderAtom } from "./custom-provider-atoms";
import { hasEnabledLocalProviderAtom } from "./local-provider-atoms";
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

const providerConfigSync = createEncryptedSyncGroup("providerConfig:", DEFAULT_PROVIDER_CONFIG);

function createProviderConfigAtom(providerId: ProviderId) {
  const key = `${SETTING_PREFIX}PROVIDER_CONFIG_${providerId.toUpperCase()}`;
  const storage = createJSONStorage<ProviderConfig>();
  const create = (s: typeof storage) =>
    atomWithStorage<ProviderConfig>(key, DEFAULT_PROVIDER_CONFIG, s, { getOnInit: true });
  return providerId === "agent-one"
    ? create(storage)
    : providerConfigSync.atom(providerId, storage, create);
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

export const providerSetupDismissedAtom = atomWithStorage<Record<string, boolean>>(
  `${SETTING_PREFIX}PROVIDER_SETUP_DISMISSED`,
  {},
  undefined,
  { getOnInit: true },
);

export const hasEnabledProviderAtom = atom((get) => {
  const builtInEnabled = PROVIDER_REGISTRY.some(
    (p) => get(providerConfigAtoms[p.id as ProviderId]).enabled,
  );
  if (builtInEnabled) return true;
  if (get(hasEnabledLocalProviderAtom)) return true;
  return get(hasEnabledCustomProviderAtom);
});
