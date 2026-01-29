import { EyeIcon, EyeOffIcon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  useEffect(() => {
    setKeyInput(apiKey);
  }, [apiKey]);

  const hasChanges = keyInput !== apiKey;

  const handleSave = () => {
    onApiKeyChange(keyInput);
  };

  const handleCancel = () => {
    setKeyInput(apiKey);
  };

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
      <AccordionContent className="px-3 pb-3">
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
            <div className="flex gap-2">
              <Input
                id={`api-key-${providerId}`}
                type={showKey ? "text" : "password"}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder={`Enter your ${label} API key`}
                className="flex-1"
              />
              <Button
                onClick={() => setShowKey(!showKey)}
                variant="outline"
                size="icon"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                variant="outline"
                size="icon"
                title="Save key"
              >
                <SaveIcon className="size-4" />
              </Button>
              <Button
                onClick={handleCancel}
                disabled={!hasChanges}
                variant="outline"
                size="icon"
                title="Cancel changes"
              >
                <RotateCcwIcon className="size-4" />
              </Button>
            </div>
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
