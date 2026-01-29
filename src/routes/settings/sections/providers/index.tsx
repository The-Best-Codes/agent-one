import { useAtom } from "jotai";
import { useState } from "react";

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { getApiKeyAtom } from "@/lib/jotai/api-key-atoms";
import { getProviderConfigAtom } from "@/lib/jotai/provider-atoms";
import {
  hasEnvKey,
  PROVIDER_REGISTRY,
  type ProviderId,
} from "@/lib/providers/registry";

import { ProviderListItem } from "./provider-list-item";

function useProviderState(providerId: ProviderId) {
  const [apiKey, setApiKey] = useAtom(getApiKeyAtom(providerId));
  const [config, setConfig] = useAtom(getProviderConfigAtom(providerId));

  return {
    apiKey,
    setApiKey,
    config,
    setConfig: (updates: Parameters<typeof setConfig>[0]) => setConfig(updates),
    hasEnvKey: hasEnvKey(providerId),
  };
}

function ProviderItem({ providerId }: { providerId: ProviderId }) {
  const provider = PROVIDER_REGISTRY.find((p) => p.id === providerId)!;
  const state = useProviderState(providerId);

  return (
    <ProviderListItem
      providerId={providerId}
      label={provider.label}
      config={state.config}
      apiKey={state.apiKey}
      hasEnvKey={state.hasEnvKey}
      onConfigChange={(updates) =>
        state.setConfig((prev) => ({ ...prev, ...updates }))
      }
      onApiKeyChange={state.setApiKey}
    />
  );
}

export default function ProvidersSection() {
  const { isApiKeysLoading } = useApiKeys();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProviders = PROVIDER_REGISTRY.filter((provider) =>
    provider.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isApiKeysLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Configure AI providers and their API keys. Enable or disable providers
          to control which models appear in the model selector.
        </p>

        <Input
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {filteredProviders.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            className="border-border w-full rounded-md border"
          >
            {filteredProviders.map((provider) => (
              <ProviderItem key={provider.id} providerId={provider.id} />
            ))}
          </Accordion>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No providers found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
