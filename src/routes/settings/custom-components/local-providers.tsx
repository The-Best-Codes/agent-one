import { useAtomValue, useSetAtom } from "jotai";
import { memo, useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Accordion } from "@/components/ui/native/accordion";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  getLocalProviderAtom,
  localProviderIdsAtom,
  localProviderSearchItemsAtom,
  updateLocalProviderAtom,
} from "@/lib/jotai/local-provider-atoms";
import { providerSetupDismissedAtom } from "@/lib/jotai/provider-atoms";

import SettingsTarget from "../settings-target";
import { ProviderAccordionItem } from "./providers/provider-accordion-item";

interface LocalProviderListItemProps {
  providerId: string;
  onOpenChange?: (id: string) => void;
}

const LocalProviderListItem = memo(function LocalProviderListItem({
  providerId,
  onOpenChange,
}: LocalProviderListItemProps) {
  const provider = useAtomValue(getLocalProviderAtom(providerId));
  const updateProvider = useSetAtom(updateLocalProviderAtom);
  const setupDismissed = useAtomValue(providerSetupDismissedAtom);
  const dismissSetup = useSetAtom(providerSetupDismissedAtom);
  const [wasInitiallyEnabled] = useState(provider?.enabled ?? false);

  if (!provider) {
    return null;
  }

  const showSetupButton = provider.enabled && !wasInitiallyEnabled && !setupDismissed[provider.id];
  const handleSetupDismiss = () => {
    dismissSetup((prev) => ({ ...prev, [provider.id]: true }));
  };

  return (
    <ProviderAccordionItem
      id={provider.id}
      title={provider.name}
      enabled={provider.enabled}
      showSetupButton={showSetupButton}
      onSetupDismiss={handleSetupDismiss}
      apiKey=""
      onApiKeyChange={() => {}}
      headers={provider.headers}
      onHeadersChange={(headers) => updateProvider(provider.id, { headers })}
      models={provider.models}
      onModelsChange={(models) => updateProvider(provider.id, { models })}
      showApiKey={false}
      apiKeyPlaceholder="No API key required"
      modelListBaseUrl={provider.baseUrl}
      modelListHeaders={provider.headers}
      autoFetchOnMount
      emptyTitle="No models configured"
      emptyDescription="Fetch models from Ollama or add one manually."
      details={
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`base-url-${provider.id}`}>Base URL</FieldLabel>
            <Input
              id={`base-url-${provider.id}`}
              value={provider.baseUrl}
              onChange={(event) => updateProvider(provider.id, { baseUrl: event.target.value })}
              placeholder="e.g. http://127.0.0.1:11434/v1"
            />
          </Field>
        </FieldGroup>
      }
      onEnabledChange={(enabled) => updateProvider(provider.id, { enabled })}
      onOpenChange={onOpenChange}
    />
  );
});

export default function LocalProvidersSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState("");
  const localProviderIds = useAtomValue(localProviderIdsAtom);
  const localProviderSearchItems = useAtomValue(localProviderSearchItemsAtom);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProviderIds = useMemo(() => {
    if (!normalizedQuery) {
      return localProviderIds;
    }

    return localProviderSearchItems
      .filter((provider) => provider.name.toLowerCase().includes(normalizedQuery))
      .map((provider) => provider.id);
  }, [localProviderIds, localProviderSearchItems, normalizedQuery]);

  return (
    <SettingsTarget id="setting-local-providers">
      <Card size="sm">
        <CardHeader>
          <CardTitle>Local Providers</CardTitle>
          <CardDescription>
            Configure built-in local providers that can automatically discover models on startup.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SearchInput
            placeholder="Search local providers..."
            value={searchQuery}
            onChange={(event) => {
              trackSettingsInteraction("providers", "local_search_changed", {
                value_length: event.target.value.length,
              });
              setSearchQuery(event.target.value);
            }}
          />

          {filteredProviderIds.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={openItem}
              onValueChange={(value) => {
                setOpenItem(typeof value === "string" ? value : (value[0] ?? ""));
              }}
            >
              {filteredProviderIds.map((providerId) => (
                <LocalProviderListItem
                  key={providerId}
                  providerId={providerId}
                  onOpenChange={setOpenItem}
                />
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No local providers found.
            </p>
          )}
        </CardContent>
      </Card>
    </SettingsTarget>
  );
}
