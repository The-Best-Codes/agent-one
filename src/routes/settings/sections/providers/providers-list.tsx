import { IconPlugConnected } from "@tabler/icons-react";
import { useAtom, useSetAtom } from "jotai";
import { useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Accordion } from "@/components/ui/native/accordion";
import { useProviderState } from "@/hooks/use-provider-state";
import { getBuiltInProviderModels } from "@/lib/ai/providers/provider-models";
import { getProviderById, PROVIDER_REGISTRY, type ProviderId } from "@/lib/ai/providers/registry";
import {
  deleteCustomProviderApiKeyAtom,
  setCustomProviderApiKeyAtom,
} from "@/lib/jotai/custom-provider-api-key-atoms";
import {
  addCustomProviderAtom,
  customProvidersAtom,
  deleteCustomProviderAtom,
  updateCustomProviderAtom,
} from "@/lib/jotai/custom-provider-atoms";

import { AddProviderDropdown } from "./add-provider-dropdown";
import { CustomProviderListItem } from "./custom-provider-list-item";
import { ProviderListItem } from "./provider-list-item";

function BuiltInProviderItem({ providerId }: { providerId: ProviderId }) {
  const provider = getProviderById(providerId);
  const state = useProviderState(providerId);

  return (
    <ProviderListItem
      providerId={providerId}
      label={provider.label}
      config={state.config}
      builtInModels={getBuiltInProviderModels(providerId)}
      apiKey={state.apiKey}
      hasEnvKey={state.hasEnvKey}
      onConfigChange={state.setConfig}
      onApiKeyChange={state.setApiKey}
    />
  );
}

export function ProvidersList() {
  const [builtInSearchQuery, setBuiltInSearchQuery] = useState("");
  const [customSearchQuery, setCustomSearchQuery] = useState("");

  const [customProviders] = useAtom(customProvidersAtom);
  const [, addCustomProvider] = useAtom(addCustomProviderAtom);
  const [, updateCustomProvider] = useAtom(updateCustomProviderAtom);
  const [, deleteCustomProvider] = useAtom(deleteCustomProviderAtom);
  const setCustomProviderApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const deleteCustomProviderApiKey = useSetAtom(deleteCustomProviderApiKeyAtom);

  const filteredBuiltInProviders = useMemo(
    () =>
      PROVIDER_REGISTRY.filter(
        (provider) =>
          provider.id !== "agent-one" &&
          provider.label.toLowerCase().includes(builtInSearchQuery.trim().toLowerCase()),
      ),
    [builtInSearchQuery],
  );

  const filteredCustomProviders = useMemo(
    () =>
      customProviders.filter((provider) =>
        provider.name.toLowerCase().includes(customSearchQuery.trim().toLowerCase()),
      ),
    [customProviders, customSearchQuery],
  );

  const handleAddProvider = (data: Parameters<typeof addCustomProvider>[0], apiKey: string) => {
    const providerId = addCustomProvider(data);
    if (apiKey) {
      void setCustomProviderApiKey(providerId, apiKey);
    }
  };

  const handleDeleteProvider = (providerId: string) => {
    deleteCustomProvider(providerId);
    void deleteCustomProviderApiKey(providerId);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Built-in Providers</CardTitle>
          <CardDescription>
            Enable built-in providers, set keys and headers, and override model metadata when
            needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SearchInput
            placeholder="Search built-in providers..."
            value={builtInSearchQuery}
            onChange={(e) => setBuiltInSearchQuery(e.target.value)}
          />

          {filteredBuiltInProviders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredBuiltInProviders.map((provider) => (
                <BuiltInProviderItem key={provider.id} providerId={provider.id} />
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No built-in providers found.
            </p>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Custom Providers</CardTitle>
          <CardDescription>
            Add OpenAI-compatible providers and configure exactly which models they expose.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <SearchInput
              placeholder="Search custom providers..."
              value={customSearchQuery}
              onChange={(e) => setCustomSearchQuery(e.target.value)}
              className="flex-1"
            />
            <AddProviderDropdown onAddProvider={handleAddProvider} />
          </div>

          {customProviders.length === 0 ? (
            <Empty className="bg-muted/20 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconPlugConnected />
                </EmptyMedia>
                <EmptyTitle>No custom providers yet</EmptyTitle>
                <EmptyDescription>
                  Add an OpenAI-compatible provider, then configure its models and metadata here.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <AddProviderDropdown onAddProvider={handleAddProvider} />
              </EmptyContent>
            </Empty>
          ) : filteredCustomProviders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredCustomProviders.map((provider) => (
                <CustomProviderListItem
                  key={provider.id}
                  provider={provider}
                  onUpdate={(updates) => updateCustomProvider(provider.id, updates)}
                  onDelete={() => handleDeleteProvider(provider.id)}
                />
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No custom providers found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
