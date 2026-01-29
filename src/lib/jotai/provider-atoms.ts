import { atomWithStorage } from "jotai/utils";

const SETTING_PREFIX = "agent-one-setting-";

export type ProviderId = "cerebras" | "google" | "groq" | "openrouter";

export interface ProviderConfig {
  enabled: boolean;
  headers: Record<string, string>;
}

const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  enabled: false,
  headers: {},
};

const createProviderConfigAtom = (providerId: ProviderId) => {
  const key = `${SETTING_PREFIX}PROVIDER_CONFIG_${providerId.toUpperCase()}`;
  return atomWithStorage<ProviderConfig>(
    key,
    DEFAULT_PROVIDER_CONFIG,
    undefined,
    {
      getOnInit: true,
    },
  );
};

export const cerebrasConfigAtom = createProviderConfigAtom("cerebras");
export const googleConfigAtom = createProviderConfigAtom("google");
export const groqConfigAtom = createProviderConfigAtom("groq");
export const openrouterConfigAtom = createProviderConfigAtom("openrouter");

export const providerConfigAtoms = {
  cerebras: cerebrasConfigAtom,
  google: googleConfigAtom,
  groq: groqConfigAtom,
  openrouter: openrouterConfigAtom,
} as const;
