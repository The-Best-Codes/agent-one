import {
  EyeIcon,
  EyeOffIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import { useState } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CustomProvider } from "@/lib/jotai/custom-provider-atoms";

import { DeleteProviderDialog } from "./delete-provider-dialog";
import { ModelList } from "./model-list";

interface CustomProviderListItemProps {
  provider: CustomProvider;
  onUpdate: (updates: Partial<Omit<CustomProvider, "id">>) => void;
  onDelete: () => void;
}

interface ApiKeyInputProps {
  providerId: string;
  apiKey: string;
  onSave: (key: string) => void;
}

function ApiKeyInput({ providerId, apiKey, onSave }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState(apiKey);

  const hasChanges = keyInput !== apiKey;

  const handleSave = () => {
    onSave(keyInput);
  };

  const handleCancel = () => {
    setKeyInput(apiKey);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`api-key-${providerId}`} className="text-xs">
        API Key (optional)
      </Label>
      <div className="flex gap-2">
        <Input
          id={`api-key-${providerId}`}
          type={showKey ? "text" : "password"}
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="Enter API key if required"
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
  );
}

export function CustomProviderListItem({
  provider,
  onUpdate,
  onDelete,
}: CustomProviderListItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <>
      <AccordionItem value={provider.id}>
        <div className="flex items-center gap-2 px-3 *:first:flex-1">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <span>{provider.name}</span>
              <Badge variant="secondary">Custom</Badge>
            </div>
          </AccordionTrigger>
          <Switch
            id={`enabled-${provider.id}`}
            checked={provider.enabled}
            onCheckedChange={(checked) => onUpdate({ enabled: checked })}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Enable ${provider.name}`}
          />
        </div>
        <AccordionContent className="px-3 pb-3">
          <div className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor={`name-${provider.id}`} className="text-xs">
                Name
              </Label>
              <Input
                id={`name-${provider.id}`}
                value={provider.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Provider name"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`base-url-${provider.id}`} className="text-xs">
                Base URL
              </Label>
              <Input
                id={`base-url-${provider.id}`}
                value={provider.baseUrl}
                onChange={(e) => onUpdate({ baseUrl: e.target.value })}
                placeholder="e.g., http://localhost:1234/v1"
              />
            </div>

            <ApiKeyInput
              key={provider.apiKey}
              providerId={provider.id}
              apiKey={provider.apiKey}
              onSave={(key) => onUpdate({ apiKey: key })}
            />

            <HttpHeadersEditor
              id={provider.id}
              headers={provider.headers}
              onChange={(headers) => onUpdate({ headers })}
              labelClassName="text-xs"
            />

            <ModelList
              models={provider.models}
              baseUrl={provider.baseUrl}
              apiKey={provider.apiKey}
              headers={provider.headers}
              onChange={(models) => onUpdate({ models })}
            />

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="w-fit"
            >
              <Trash2Icon className="size-4" />
              Delete Provider
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>

      <DeleteProviderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        providerName={provider.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
}
