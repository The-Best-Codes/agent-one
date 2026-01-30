import { useAtom } from "jotai";
import { useState } from "react";

import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import {
  PROVIDER_REGISTRY,
  type ProviderId,
} from "@/lib/ai/providers/registry";
import { useProviderState } from "@/lib/hooks/use-provider-state";
import {
  addCustomProviderAtom,
  type CustomProviderModel,
  customProvidersAtom,
  deleteCustomProviderAtom,
  updateCustomProviderAtom,
} from "@/lib/jotai/custom-provider-atoms";

import { AddProviderDropdown } from "./add-provider-dropdown";
import { CustomProviderListItem } from "./custom-provider-list-item";
import { ProviderListItem } from "./provider-list-item";

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
      onConfigChange={state.setConfig}
      onApiKeyChange={state.setApiKey}
    />
  );
}

export default function ProvidersSection() {
  const { isApiKeysLoading } = useApiKeys();
  const [searchQuery, setSearchQuery] = useState("");

  const [customProviders] = useAtom(customProvidersAtom);
  const [, addCustomProvider] = useAtom(addCustomProviderAtom);
  const [, updateCustomProvider] = useAtom(updateCustomProviderAtom);
  const [, deleteCustomProvider] = useAtom(deleteCustomProviderAtom);

  const filteredBuiltInProviders = PROVIDER_REGISTRY.filter((provider) =>
    provider.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCustomProviders = customProviders.filter((provider) =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasResults =
    filteredBuiltInProviders.length > 0 || filteredCustomProviders.length > 0;

  const handleAddProvider = (data: {
    name: string;
    baseUrl: string;
    apiKey: string;
    headers: Record<string, string>;
    models: CustomProviderModel[];
  }) => {
    addCustomProvider({
      name: data.name,
      baseUrl: data.baseUrl,
      apiKey: data.apiKey,
      headers: data.headers,
      models: data.models,
    });
  };

  if (isApiKeysLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="leading-none font-semibold">Providers</h2>
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
        <h2 className="leading-none font-semibold">Providers</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Configure AI providers and their API keys. Enable or disable providers
          to control which models appear in the model selector.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <AddProviderDropdown onAddProvider={handleAddProvider} />
        </div>

        {hasResults ? (
          <Accordion
            type="single"
            collapsible
            className="border-border w-full rounded-md border"
          >
            {filteredBuiltInProviders.map((provider) => (
              <ProviderItem key={provider.id} providerId={provider.id} />
            ))}
            {filteredCustomProviders.map((provider) => (
              <CustomProviderListItem
                key={provider.id}
                provider={provider}
                onUpdate={(updates) =>
                  updateCustomProvider(provider.id, updates)
                }
                onDelete={() => deleteCustomProvider(provider.id)}
              />
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
