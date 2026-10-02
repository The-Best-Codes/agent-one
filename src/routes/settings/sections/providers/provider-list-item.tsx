import { IconAlertTriangle, IconSettings, IconTrash } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai";
import { memo, useMemo, useRef, useState, type ReactNode } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { SecretInput } from "@/components/a1/input/secret-input";
import { ProviderLogo } from "@/components/a1/provider-logo";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { modelDirectoryDataAtom } from "@/lib/ai/models/model-directory";
import {
  getBuiltInProviderModels,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";
import type { ProviderId } from "@/lib/ai/providers/registry";
import { getApiKeyAtom } from "@/lib/jotai/api-key-atoms";
import {
  getCustomProviderApiKeyAtom,
  setCustomProviderApiKeyAtom,
} from "@/lib/jotai/custom-provider-api-key-atoms";
import {
  getCustomProviderAtom,
  updateCustomProviderAtom,
  type CustomProvider,
} from "@/lib/jotai/custom-provider-atoms";
import { getLocalProviderAtom, updateLocalProviderAtom } from "@/lib/jotai/local-provider-atoms";
import {
  getProviderConfigAtom,
  providerSetupDismissedAtom,
  type ProviderConfig,
} from "@/lib/jotai/provider-atoms";

import { ModelList } from "./model-list";
import { DeleteProviderDialog } from "./provider-dialogs";

interface SharedProviderEditorProps {
  id: string;
  title: string;
  enabled: boolean;
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
  headers: Record<string, string>;
  onHeadersChange: (headers: Record<string, string>) => void;
  models: ProviderModelMetadata[];
  onModelsChange: (models: ProviderModelMetadata[]) => void;
  builtInModels?: ProviderModelMetadata[];
  apiKeyPlaceholder: string;
  apiKeyHint?: string;
  modelListBaseUrl?: string;
  modelListHeaders?: Record<string, string>;
  modelListApiKey?: string;
  addButtonLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  details?: ReactNode;
  footer?: ReactNode;
  showApiKey?: boolean;
  autoFetchOnMount?: boolean;
  showSetupButton?: boolean;
  showMissingKeyWarning?: boolean;
  onSetupDismiss?: () => void;
  onEnabledChange: (enabled: boolean) => void;
}

interface BuiltInProviderListItemProps {
  providerId: ProviderId;
  label: string;
  hasEnvKey: boolean;
}

interface CustomProviderListItemProps {
  providerId: string;
  onDelete: () => void;
}

interface LocalProviderListItemProps {
  providerId: string;
}

const ProviderEditorItem = memo(function ProviderEditorItem({
  id,
  title,
  enabled,
  apiKey,
  onApiKeyChange,
  headers,
  onHeadersChange,
  models,
  onModelsChange,
  builtInModels = [],
  apiKeyPlaceholder,
  apiKeyHint,
  modelListBaseUrl,
  modelListHeaders,
  modelListApiKey,
  addButtonLabel,
  emptyTitle,
  emptyDescription,
  details,
  footer,
  showApiKey = true,
  autoFetchOnMount = false,
  showSetupButton = false,
  showMissingKeyWarning = false,
  onSetupDismiss,
  onEnabledChange,
}: SharedProviderEditorProps) {
  return (
    <Dialog>
      <div className="flex items-center gap-2 px-1 py-2">
        <DialogTrigger asChild>
          <button
            type="button"
            className="focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md text-left text-sm font-medium outline-none focus-visible:ring-[3px]"
            aria-label={`Configure ${title} provider`}
          >
            <ProviderLogo id={id} title={title} />
            <span>{title}</span>
            {showMissingKeyWarning && (
              <AdaptiveTooltip>
                <AdaptiveTooltipTrigger asChild>
                  <span className="inline-flex">
                    <IconAlertTriangle className="size-4" />
                  </span>
                </AdaptiveTooltipTrigger>
                <AdaptiveTooltipContent>No API key set</AdaptiveTooltipContent>
              </AdaptiveTooltip>
            )}
          </button>
        </DialogTrigger>
        {showSetupButton && onSetupDismiss && (
          <DialogTrigger asChild>
            <Button size="xs" variant="default" onClick={onSetupDismiss}>
              <IconAlertTriangle data-icon="inline-start" />
              Set Up Provider
            </Button>
          </DialogTrigger>
        )}
        <DialogTrigger asChild>
          <Button variant="outline" size="icon-xs" aria-label={`Configure ${title} provider`}>
            <IconSettings />
          </Button>
        </DialogTrigger>
        <Switch
          id={`enabled-${id}`}
          checked={enabled}
          onCheckedChange={onEnabledChange}
          aria-label={`Enable ${title}`}
        />
      </div>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure {title} provider</DialogTitle>
          <DialogDescription>Customize the settings and models for {title}.</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
          <div className="flex flex-col gap-4">
            {details}

            {showApiKey ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor={`api-key-${id}`} className="text-xs">
                  API Key
                </Label>
                {apiKeyHint ? <p className="text-muted-foreground text-sm">{apiKeyHint}</p> : null}
                <SecretInput
                  id={`api-key-${id}`}
                  value={apiKey}
                  onChange={onApiKeyChange}
                  placeholder={apiKeyPlaceholder}
                  showSaveCancel
                />
              </div>
            ) : null}

            <HttpHeadersEditor
              id={id}
              headers={headers}
              onChange={onHeadersChange}
              labelClassName="text-xs"
            />

            <ModelList
              models={models}
              builtInModels={builtInModels}
              baseUrl={modelListBaseUrl}
              apiKey={modelListApiKey}
              headers={modelListHeaders}
              autoFetchOnMount={autoFetchOnMount}
              addButtonLabel={addButtonLabel}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
              onChange={onModelsChange}
            />
          </div>
        </div>
        <DialogFooter showCloseButton={!footer}>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export const BuiltInProviderListItem = memo(function BuiltInProviderListItem({
  providerId,
  label,
  hasEnvKey,
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
  const wasInitiallyEnabled = useRef(storedConfig.enabled);

  const updateConfig = (updates: Partial<ProviderConfig>) => {
    setConfigAtom((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  const showSetupButton =
    storedConfig.enabled && !wasInitiallyEnabled.current && !setupDismissed[providerId];
  const showMissingKeyWarning = storedConfig.enabled && !storedApiKey && !hasEnvKey;
  const handleSetupDismiss = () => {
    dismissSetup((prev) => ({ ...prev, [providerId]: true }));
  };

  return (
    <ProviderEditorItem
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
    />
  );
});

export const CustomProviderListItem = memo(function CustomProviderListItem({
  providerId,
  onDelete,
}: CustomProviderListItemProps) {
  const provider = useAtomValue(getCustomProviderAtom(providerId));
  const apiKey = useAtomValue(getCustomProviderApiKeyAtom(providerId));
  const updateProvider = useSetAtom(updateCustomProviderAtom);
  const setApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const setupDismissed = useAtomValue(providerSetupDismissedAtom);
  const dismissSetup = useSetAtom(providerSetupDismissedAtom);
  const wasInitiallyEnabled = useRef(provider?.enabled ?? false);

  if (!provider) {
    return null;
  }

  const update = (updates: Partial<Omit<CustomProvider, "id">>) => {
    updateProvider(provider.id, updates);
  };

  const showSetupButton =
    provider.enabled && !wasInitiallyEnabled.current && !setupDismissed[provider.id];
  const showMissingKeyWarning = provider.enabled && !apiKey;
  const handleSetupDismiss = () => {
    dismissSetup((prev) => ({ ...prev, [provider.id]: true }));
  };

  return (
    <>
      <ProviderEditorItem
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
            onClick={() => {
              setDeleteDialogOpen(true);
            }}
          >
            <IconTrash data-icon="inline-start" />
            Delete Provider
          </Button>
        }
        onEnabledChange={(enabled) => update({ enabled })}
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

export const LocalProviderListItem = memo(function LocalProviderListItem({
  providerId,
}: LocalProviderListItemProps) {
  const provider = useAtomValue(getLocalProviderAtom(providerId));
  const updateProvider = useSetAtom(updateLocalProviderAtom);
  const setupDismissed = useAtomValue(providerSetupDismissedAtom);
  const dismissSetup = useSetAtom(providerSetupDismissedAtom);
  const wasInitiallyEnabled = useRef(provider?.enabled ?? false);

  if (!provider) {
    return null;
  }

  const showSetupButton =
    provider.enabled && !wasInitiallyEnabled.current && !setupDismissed[provider.id];
  const handleSetupDismiss = () => {
    dismissSetup((prev) => ({ ...prev, [provider.id]: true }));
  };

  return (
    <ProviderEditorItem
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
    />
  );
});
