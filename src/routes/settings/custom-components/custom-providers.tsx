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

import SettingsTarget from "../settings-target";
import { AddProviderDropdown } from "./providers/add-provider-dropdown";
import { CustomProviderListItem } from "./providers/provider-list-item";

export default function CustomProvidersSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState("");
  const customProviderIds = useAtomValue(customProviderIdsAtom);
  const customProviderSearchItems = useAtomValue(customProviderSearchItemsAtom);
  const addCustomProvider = useSetAtom(addCustomProviderAtom);
  const deleteCustomProvider = useSetAtom(deleteCustomProviderAtom);
  const setCustomProviderApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const deleteCustomProviderApiKey = useSetAtom(deleteCustomProviderApiKeyAtom);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProviderIds = useMemo(() => {
    if (!normalizedQuery) {
      return customProviderIds;
    }

    return customProviderSearchItems
      .filter((provider) => provider.name.toLowerCase().includes(normalizedQuery))
      .map((provider) => provider.id);
  }, [customProviderIds, customProviderSearchItems, normalizedQuery]);

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
              value={searchQuery}
              onChange={(event) => {
                trackSettingsInteraction("providers", "custom_search_changed", {
                  value_length: event.target.value.length,
                });
                setSearchQuery(event.target.value);
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
          ) : filteredProviderIds.length > 0 ? (
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
                <CustomProviderListItem
                  key={providerId}
                  providerId={providerId}
                  onDelete={() => handleDeleteProvider(providerId)}
                  onOpenChange={setOpenItem}
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
  );
}
