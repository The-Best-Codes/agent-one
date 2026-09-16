import { IconPlugConnected, IconTrash } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai";
import { memo, useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Accordion } from "@/components/ui/native/accordion";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import {
  deleteCustomProviderApiKeyAtom,
  getCustomProviderApiKeyAtom,
  setCustomProviderApiKeyAtom,
} from "@/lib/jotai/custom-provider-api-key-atoms";
import {
  addCustomProviderAtom,
  customProviderIdsAtom,
  customProviderSearchItemsAtom,
  deleteCustomProviderAtom,
  getCustomProviderAtom,
  type CustomProvider,
  type NewCustomProviderData,
  updateCustomProviderAtom,
} from "@/lib/jotai/custom-provider-atoms";
import { providerSetupDismissedAtom } from "@/lib/jotai/provider-atoms";

import { AddProviderDropdown } from "./add-provider-dropdown";
import { ProviderAccordionItem } from "./provider-accordion-item";
import { DeleteProviderDialog } from "./provider-dialogs";

interface CustomProviderListItemProps {
  providerId: string;
  onDelete: () => void;
  onOpenChange?: (id: string) => void;
}

const CustomProviderListItem = memo(function CustomProviderListItem({
  providerId,
  onDelete,
  onOpenChange,
}: CustomProviderListItemProps) {
  const provider = useAtomValue(getCustomProviderAtom(providerId));
  const apiKey = useAtomValue(getCustomProviderApiKeyAtom(providerId));
  const updateProvider = useSetAtom(updateCustomProviderAtom);
  const setApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const setupDismissed = useAtomValue(providerSetupDismissedAtom);
  const dismissSetup = useSetAtom(providerSetupDismissedAtom);
  const [wasInitiallyEnabled] = useState(provider?.enabled ?? false);

  if (!provider) {
    return null;
  }

  const update = (updates: Partial<Omit<CustomProvider, "id">>) => {
    updateProvider(provider.id, updates);
  };

  const showSetupButton = provider.enabled && !wasInitiallyEnabled && !setupDismissed[provider.id];
  const showMissingKeyWarning = provider.enabled && !apiKey;
  const handleSetupDismiss = () => {
    dismissSetup((prev) => ({ ...prev, [provider.id]: true }));
  };

  return (
    <>
      <ProviderAccordionItem
        id={provider.id}
        title={provider.name}
        enabled={provider.enabled}
        showSetupButton={showSetupButton}
        showMissingKeyWarning={showMissingKeyWarning}
        onSetupDismiss={handleSetupDismiss}
        apiKey={apiKey}
        onApiKeyChange={(nextApiKey) => void setApiKey(provider.id, nextApiKey)}
        headers={provider.headers}
        onHeadersChange={(headers) => update({ headers })}
        models={provider.models}
        onModelsChange={(models) => update({ models })}
        apiKeyPlaceholder="Enter API key if required"
        modelListBaseUrl={provider.baseUrl}
        modelListHeaders={provider.headers}
        modelListApiKey={apiKey}
        emptyTitle="No models configured"
        emptyDescription="Add a model to make it available in the model picker."
        details={
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`name-${provider.id}`}>Name</FieldLabel>
              <Input
                id={`name-${provider.id}`}
                value={provider.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="Provider name"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor={`base-url-${provider.id}`}>Base URL</FieldLabel>
              <Input
                id={`base-url-${provider.id}`}
                value={provider.baseUrl}
                onChange={(event) => update({ baseUrl: event.target.value })}
                placeholder="e.g., http://localhost:1234/v1"
              />
            </Field>
          </FieldGroup>
        }
        footer={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              trackSettingsInteraction("providers", "delete_provider_dialog_opened", {
                provider_id: provider.id,
              });
              setDeleteDialogOpen(true);
            }}
            className="w-fit"
          >
            <IconTrash data-icon="inline-start" />
            Delete Provider
          </Button>
        }
        onEnabledChange={(enabled) => update({ enabled })}
        onOpenChange={onOpenChange}
      />

      <DeleteProviderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        providerName={provider.name}
        onConfirm={() => {
          setDeleteDialogOpen(false);
          onDelete();
        }}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
});

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
    <div className="flex flex-col gap-4">
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
        <p className="text-muted-foreground py-4 text-center text-sm">No custom providers found.</p>
      )}
    </div>
  );
}
