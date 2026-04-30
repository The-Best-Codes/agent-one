import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { SecretInput } from "@/components/a1/input/secret-input";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProviderConfig, ProviderId } from "@/lib/jotai/provider-atoms";

interface ProviderListItemProps {
  providerId: ProviderId;
  label: string;
  config: ProviderConfig;
  apiKey: string;
  hasEnvKey: boolean;
  onConfigChange: (updates: Partial<ProviderConfig>) => void;
  onApiKeyChange: (key: string) => void;
}

export function ProviderListItem({
  providerId,
  label,
  config,
  apiKey,
  hasEnvKey,
  onConfigChange,
  onApiKeyChange,
}: ProviderListItemProps) {
  return (
    <AccordionItem value={providerId}>
      <div className="flex items-center gap-2 px-3 *:first:flex-1">
        <AccordionTrigger className="hover:no-underline">
          <span>{label}</span>
        </AccordionTrigger>
        <Switch
          id={`enabled-${providerId}`}
          checked={config.enabled}
          onCheckedChange={(checked) => onConfigChange({ enabled: checked })}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Enable ${label}`}
        />
      </div>
      <AccordionContent className="overflow-auto px-3 pb-3">
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
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
