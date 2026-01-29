import { atomWithStorage } from "jotai/utils";

import {
  DEFAULT_PROVIDER_CONFIGS,
  type ProviderConfig,
  type ProviderId,
} from "@/lib/settings/types";

const SETTING_PREFIX = "agent-one-setting-";

const createProviderConfigAtom = (providerId: ProviderId) => {
  const key = `${SETTING_PREFIX}PROVIDER_CONFIG_${providerId.toUpperCase()}`;
  return atomWithStorage<ProviderConfig>(
    key,
    DEFAULT_PROVIDER_CONFIGS[providerId],
    undefined,
    { getOnInit: true },
  );
};

export const cerebrasConfigAtom = createProviderConfigAtom("cerebras");
export const googleConfigAtom = createProviderConfigAtom("google");
export const groqConfigAtom = createProviderConfigAtom("groq");
export const openrouterConfigAtom = createProviderConfigAtom("openrouter");
export const opencodeConfigAtom = createProviderConfigAtom("opencode");

export const providerConfigAtoms = {
  cerebras: cerebrasConfigAtom,
  google: googleConfigAtom,
  groq: groqConfigAtom,
  openrouter: openrouterConfigAtom,
  opencode: opencodeConfigAtom,
} as const;
