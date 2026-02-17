import { atomWithStorage } from "jotai/utils";

import {
  PROVIDER_REGISTRY,
  type ProviderId,
} from "@/lib/ai/providers/registry";
import { createSyncedStorage } from "@/lib/sync/synced-storage";

export type { ProviderId } from "@/lib/ai/providers/registry";

const SETTING_PREFIX = "agent-one-setting-";

export interface ProviderConfig {
  enabled: boolean;
  headers: Record<string, string>;
}

const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  enabled: false,
  headers: {},
};

function createProviderConfigAtom(providerId: ProviderId) {
  const key = `${SETTING_PREFIX}PROVIDER_CONFIG_${providerId.toUpperCase()}`;
  return atomWithStorage<ProviderConfig>(
    key,
    DEFAULT_PROVIDER_CONFIG,
    createSyncedStorage<ProviderConfig>(),
    {
      getOnInit: true,
    },
  );
}

type ProviderConfigAtom = ReturnType<typeof createProviderConfigAtom>;

export const providerConfigAtoms = Object.fromEntries(
  PROVIDER_REGISTRY.map((provider) => [
    provider.id,
    createProviderConfigAtom(provider.id),
  ]),
) as Record<ProviderId, ProviderConfigAtom>;

export function getProviderConfigAtom(providerId: ProviderId) {
  return providerConfigAtoms[providerId];
}
