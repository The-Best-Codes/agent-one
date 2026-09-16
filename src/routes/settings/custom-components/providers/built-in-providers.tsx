import { useAtomValue, useSetAtom } from "jotai";
import { memo, useMemo, useState } from "react";

import { SearchInput } from "@/components/a1/search-input";
import { Accordion } from "@/components/ui/native/accordion";
import { modelDirectoryDataAtom } from "@/lib/ai/models/model-directory";
import { getBuiltInProviderModels } from "@/lib/ai/providers/provider-models";
import { hasEnvKey, PROVIDER_REGISTRY, type ProviderId } from "@/lib/ai/providers/registry";
import { trackSettingsInteraction } from "@/lib/google-analytics";
import { getApiKeyAtom } from "@/lib/jotai/api-key-atoms";
import {
  getProviderConfigAtom,
  providerSetupDismissedAtom,
  type ProviderConfig,
} from "@/lib/jotai/provider-atoms";

import { ProviderAccordionItem } from "./provider-accordion-item";

interface BuiltInProviderListItemProps {
  providerId: ProviderId;
  label: string;
  hasEnvKey: boolean;
  onOpenChange?: (id: string) => void;
}

const BuiltInProviderListItem = memo(function BuiltInProviderListItem({
  providerId,
  label,
  hasEnvKey,
  onOpenChange,
}: BuiltInProviderListItemProps) {
  const storedConfig = useAtomValue(getProviderConfigAtom(providerId));
  const storedApiKey = useAtomValue(getApiKeyAtom(providerId));
  const modelDirectoryData = useAtomValue(modelDirectoryDataAtom);
  const builtInModels = useMemo(
    () => getBuiltInProviderModels(providerId, modelDirectoryData),
    [modelDirectoryData, providerId],
  );
  const setConfigAtom = useSetAtom(getProviderConfigAtom(providerId));
  const setApiKey = useSetAtom(getApiKeyAtom(providerId));
  const setupDismissed = useAtomValue(providerSetupDismissedAtom);
  const dismissSetup = useSetAtom(providerSetupDismissedAtom);
  const [wasInitiallyEnabled] = useState(storedConfig.enabled);

  const updateConfig = (updates: Partial<ProviderConfig>) => {
    setConfigAtom((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  const showSetupButton =
    storedConfig.enabled && !wasInitiallyEnabled && !setupDismissed[providerId];
  const showMissingKeyWarning = storedConfig.enabled && !storedApiKey && !hasEnvKey;
  const handleSetupDismiss = () => {
    dismissSetup((prev) => ({ ...prev, [providerId]: true }));
  };

  return (
    <ProviderAccordionItem
      id={providerId}
      title={label}
      enabled={storedConfig.enabled}
      apiKey={storedApiKey}
      onApiKeyChange={setApiKey}
      headers={storedConfig.headers}
      onHeadersChange={(headers) => updateConfig({ headers })}
      models={storedConfig.models ?? []}
      onModelsChange={(models) => updateConfig({ models })}
      builtInModels={builtInModels}
      apiKeyPlaceholder={`Enter your ${label} API key`}
      apiKeyHint={hasEnvKey ? "Using environment variable. Override below if needed." : undefined}
      addButtonLabel="Add Model Override"
      emptyTitle="No model overrides"
      emptyDescription="Add a model to override built-in metadata or to register an extra model for this provider."
      onEnabledChange={(enabled) => updateConfig({ enabled })}
      showSetupButton={showSetupButton}
      showMissingKeyWarning={showMissingKeyWarning}
      onSetupDismiss={handleSetupDismiss}
      onOpenChange={onOpenChange}
    />
  );
});

export default function BuiltInProvidersSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItem, setOpenItem] = useState("");
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredProviders = useMemo(
    () =>
      PROVIDER_REGISTRY.filter(
        (provider) =>
          provider.id !== "agent-one" && provider.label.toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery],
  );

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        placeholder="Search built-in providers..."
        value={searchQuery}
        onChange={(event) => {
          trackSettingsInteraction("providers", "built_in_search_changed", {
            value_length: event.target.value.length,
          });
          setSearchQuery(event.target.value);
        }}
      />

      {filteredProviders.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          className="w-full"
          value={openItem}
          onValueChange={(value) => {
            setOpenItem(typeof value === "string" ? value : (value[0] ?? ""));
          }}
        >
          {filteredProviders.map((provider) => (
            <BuiltInProviderListItem
              key={provider.id}
              providerId={provider.id}
              label={provider.label}
              hasEnvKey={hasEnvKey(provider.id)}
              onOpenChange={setOpenItem}
            />
          ))}
        </Accordion>
      ) : (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No built-in providers found.
        </p>
      )}
    </div>
  );
}
