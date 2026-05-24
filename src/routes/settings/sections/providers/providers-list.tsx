import { IconPlugConnected } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai";
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
import { hasEnvKey, PROVIDER_REGISTRY } from "@/lib/ai/providers/registry";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  deleteCustomProviderApiKeyAtom,
  setCustomProviderApiKeyAtom,
} from "@/lib/jotai/custom-provider-api-key-atoms";
import {
  addCustomProviderAtom,
  customProviderIdsAtom,
  customProviderSearchItemsAtom,
  deleteCustomProviderAtom,
  type NewCustomProviderData,
} from "@/lib/jotai/custom-provider-atoms";
import {
  localProviderIdsAtom,
  localProviderSearchItemsAtom,
} from "@/lib/jotai/local-provider-atoms";

import SettingsTarget from "../../settings-target";
import { AddProviderDropdown } from "./add-provider-dropdown";
import {
  BuiltInProviderListItem,
  CustomProviderListItem,
  LocalProviderListItem,
} from "./provider-list-item";

export function ProvidersList() {
  const [builtInSearchQuery, setBuiltInSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [customSearchQuery, setCustomSearchQuery] = useState("");

  const localProviderIds = useAtomValue(localProviderIdsAtom);
  const localProviderSearchItems = useAtomValue(localProviderSearchItemsAtom);
  const customProviderIds = useAtomValue(customProviderIdsAtom);
  const customProviderSearchItems = useAtomValue(customProviderSearchItemsAtom);
  const addCustomProvider = useSetAtom(addCustomProviderAtom);
  const deleteCustomProvider = useSetAtom(deleteCustomProviderAtom);
  const setCustomProviderApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const deleteCustomProviderApiKey = useSetAtom(deleteCustomProviderApiKeyAtom);

  const normalizedBuiltInQuery = builtInSearchQuery.trim().toLowerCase();
  const normalizedLocalQuery = localSearchQuery.trim().toLowerCase();
  const normalizedCustomQuery = customSearchQuery.trim().toLowerCase();

  const filteredBuiltInProviders = useMemo(
    () =>
      PROVIDER_REGISTRY.filter(
        (provider) =>
          provider.id !== "agent-one" &&
          provider.label.toLowerCase().includes(normalizedBuiltInQuery),
      ),
    [normalizedBuiltInQuery],
  );

  const filteredCustomProviderIds = useMemo(() => {
    if (!normalizedCustomQuery) {
      return customProviderIds;
    }

    return customProviderSearchItems
      .filter((provider) => provider.name.toLowerCase().includes(normalizedCustomQuery))
      .map((provider) => provider.id);
  }, [customProviderIds, customProviderSearchItems, normalizedCustomQuery]);

  const filteredLocalProviderIds = useMemo(() => {
    if (!normalizedLocalQuery) {
      return localProviderIds;
    }

    return localProviderSearchItems
      .filter((provider) => provider.name.toLowerCase().includes(normalizedLocalQuery))
      .map((provider) => provider.id);
  }, [localProviderIds, localProviderSearchItems, normalizedLocalQuery]);

  const handleAddProvider = (data: NewCustomProviderData, apiKey: string) => {
    trackSettingsInteraction("providers", "custom_provider_added", {
      has_api_key: Boolean(apiKey.trim()),
      model_count: data.models.length,
    });
    const providerId = addCustomProvider(data);

    if (apiKey) {
      void setCustomProviderApiKey(providerId, apiKey);
    }
  };

  const handleDeleteProvider = (providerId: string) => {
    trackSettingsInteraction("providers", "custom_provider_deleted");
    deleteCustomProvider(providerId);
    void deleteCustomProviderApiKey(providerId);
  };

  return (
    <div className="flex flex-col gap-4">
      <SettingsTarget id="setting-built-in-providers">
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
              onChange={(event) => {
                trackSettingsInteraction("providers", "built_in_search_changed", {
                  value_length: event.target.value.length,
                });
                setBuiltInSearchQuery(event.target.value);
              }}
            />

            {filteredBuiltInProviders.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredBuiltInProviders.map((provider) => (
                  <BuiltInProviderListItem
                    key={provider.id}
                    providerId={provider.id}
                    label={provider.label}
                    hasEnvKey={hasEnvKey(provider.id)}
                  />
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground py-4 text-center text-sm">
                No built-in providers found.
              </p>
            )}
          </CardContent>
        </Card>
      </SettingsTarget>

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
              value={localSearchQuery}
              onChange={(event) => {
                trackSettingsInteraction("providers", "local_search_changed", {
                  value_length: event.target.value.length,
                });
                setLocalSearchQuery(event.target.value);
              }}
            />

            {filteredLocalProviderIds.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredLocalProviderIds.map((providerId) => (
                  <LocalProviderListItem key={providerId} providerId={providerId} />
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

      <SettingsTarget id="setting-custom-providers">
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
                onChange={(event) => {
                  trackSettingsInteraction("providers", "custom_search_changed", {
                    value_length: event.target.value.length,
                  });
                  setCustomSearchQuery(event.target.value);
                }}
                containerClassName="flex-1"
              />
              <AddProviderDropdown onAddProvider={handleAddProvider} />
            </div>

            {customProviderIds.length === 0 ? (
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
            ) : filteredCustomProviderIds.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredCustomProviderIds.map((providerId) => (
                  <CustomProviderListItem
                    key={providerId}
                    providerId={providerId}
                    onDelete={() => handleDeleteProvider(providerId)}
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
      </SettingsTarget>
    </div>
  );
}
