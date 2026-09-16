import { IconAlertTriangle } from "@tabler/icons-react";
import { memo, type ReactNode } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { SecretInput } from "@/components/a1/input/secret-input";
import { ProviderLogo } from "@/components/a1/provider-logo";
import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Switch } from "@/components/ui/switch";
import type { ProviderModelMetadata } from "@/lib/ai/providers/provider-models";
import { trackSettingsInteraction } from "@/lib/google-analytics";

import { ModelList } from "./model-list";

export interface ProviderAccordionItemProps {
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
  onOpenChange?: (id: string) => void;
  onEnabledChange: (enabled: boolean) => void;
}

export const ProviderAccordionItem = memo(function ProviderAccordionItem({
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
  onOpenChange,
  onEnabledChange,
}: ProviderAccordionItemProps) {
  return (
    <AccordionItem value={id}>
      <AccordionTrigger className="px-1 py-2 hover:no-underline">
        <div className="flex flex-1 items-center justify-between gap-2 pr-2">
          <span className="flex items-center gap-2">
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
          </span>
          <span className="flex items-center gap-2">
            {showSetupButton && onSetupDismiss && (
              <Button
                size="xs"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetupDismiss();
                  onOpenChange?.(id);
                }}
              >
                <IconAlertTriangle data-icon="inline-start" />
                Set Up Provider
              </Button>
            )}
            <Switch
              id={`enabled-${id}`}
              checked={enabled}
              onCheckedChange={(checked) => {
                trackSettingsInteraction("providers", "provider_enabled_toggled", {
                  provider_id: id,
                  enabled: checked,
                });
                onEnabledChange(checked);
              }}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Enable ${title}`}
            />
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="overflow-auto px-1 pb-3">
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

          {footer}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});
