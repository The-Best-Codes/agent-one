import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";

import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { getProviderById, PROVIDER_REGISTRY, type ProviderId } from "@/lib/ai/providers/registry";
import { useProviderState } from "@/lib/hooks/use-provider-state";
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

function ProviderItem({ providerId }: { providerId: ProviderId }) {
  const provider = getProviderById(providerId);
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

export function ProvidersList() {
  const [searchQuery, setSearchQuery] = useState("");

  const [customProviders] = useAtom(customProvidersAtom);
  const [, addCustomProvider] = useAtom(addCustomProviderAtom);
  const [, updateCustomProvider] = useAtom(updateCustomProviderAtom);
  const [, deleteCustomProvider] = useAtom(deleteCustomProviderAtom);
  const setCustomProviderApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const deleteCustomProviderApiKey = useSetAtom(deleteCustomProviderApiKeyAtom);

  const filteredBuiltInProviders = PROVIDER_REGISTRY.filter(
    (provider) =>
      provider.id !== "agent-one" &&
      provider.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCustomProviders = customProviders.filter((provider) =>
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasResults = filteredBuiltInProviders.length > 0 || filteredCustomProviders.length > 0;

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
        <Accordion type="single" collapsible className="border-border w-full rounded-md border">
          {filteredCustomProviders.map((provider) => (
            <CustomProviderListItem
              key={provider.id}
              provider={provider}
              onUpdate={(updates) => updateCustomProvider(provider.id, updates)}
              onDelete={() => handleDeleteProvider(provider.id)}
            />
          ))}
          {filteredBuiltInProviders.map((provider) => (
            <ProviderItem key={provider.id} providerId={provider.id} />
          ))}
        </Accordion>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-sm">No providers found</p>
      )}
    </div>
  );
}
