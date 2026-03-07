import { useAtom } from "jotai";

import { hasEnvKey } from "@/lib/ai/providers/registry";
import { getApiKeyAtom } from "@/lib/jotai/api-key-atoms";
import {
  getProviderConfigAtom,
  type ProviderConfig,
  type ProviderId,
} from "@/lib/jotai/provider-atoms";

export function useProviderState(providerId: ProviderId) {
  const [apiKey, setApiKey] = useAtom(getApiKeyAtom(providerId));
  const [config, setConfig] = useAtom(getProviderConfigAtom(providerId));

  return {
    apiKey,
    setApiKey,
    config,
    setConfig: (updates: Partial<ProviderConfig>) => setConfig((prev) => ({ ...prev, ...updates })),
    hasEnvKey: hasEnvKey(providerId),
  };
}
