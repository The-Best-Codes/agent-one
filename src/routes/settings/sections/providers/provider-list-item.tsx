import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { SecretInput } from "@/components/a1/input/secret-input";
import { Label } from "@/components/ui/label";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
import { Switch } from "@/components/ui/switch";
import type { ProviderModelMetadata } from "@/lib/ai/providers/provider-models";
import type { ProviderConfig, ProviderId } from "@/lib/jotai/provider-atoms";

import { ModelList } from "./model-list";

interface ProviderListItemProps {
  providerId: ProviderId;
  label: string;
  config: ProviderConfig;
  builtInModels: ProviderModelMetadata[];
  apiKey: string;
  hasEnvKey: boolean;
  onConfigChange: (updates: Partial<ProviderConfig>) => void;
  onApiKeyChange: (key: string) => void;
}

export function ProviderListItem({
  providerId,
  label,
  config,
  builtInModels,
  apiKey,
  hasEnvKey,
  onConfigChange,
  onApiKeyChange,
}: ProviderListItemProps) {
  return (
    <AccordionItem value={providerId}>
      <AccordionTrigger className="px-1 py-2 hover:no-underline">
        <div className="flex flex-1 items-center justify-between gap-2 pr-2">
          <span>{label}</span>
          <Switch
            id={`enabled-${providerId}`}
            checked={config.enabled}
            onCheckedChange={(checked) => onConfigChange({ enabled: checked })}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Enable ${label}`}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="overflow-auto px-1 pb-3">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`api-key-${providerId}`} className="text-xs">
              API Key
            </Label>
            {hasEnvKey ? (
              <p className="text-muted-foreground text-sm">
                Using environment variable. Override below if needed.
              </p>
            ) : null}
            <SecretInput
              id={`api-key-${providerId}`}
              value={apiKey}
              onChange={onApiKeyChange}
              placeholder={`Enter your ${label} API key`}
              showSaveCancel
            />
          </div>

          <HttpHeadersEditor
            id={providerId}
            headers={config.headers}
            onChange={(headers) => onConfigChange({ headers })}
            labelClassName="text-xs"
          />

          <ModelList
            models={config.models ?? []}
            builtInModels={builtInModels}
            addButtonLabel="Add Model Override"
            emptyTitle="No model overrides"
            emptyDescription="Add a model to override built-in metadata or to register an extra model for this provider."
            onChange={(models) => onConfigChange({ models })}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
