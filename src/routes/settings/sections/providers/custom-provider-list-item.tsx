import { useAtomValue, useSetAtom } from "jotai";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { SecretInput } from "@/components/a1/input/secret-input";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  customProviderApiKeysAtom,
  setCustomProviderApiKeyAtom,
} from "@/lib/jotai/custom-provider-api-key-atoms";
import type { CustomProvider } from "@/lib/jotai/custom-provider-atoms";

import { DeleteProviderDialog } from "./delete-provider-dialog";
import { ModelList } from "./model-list";

interface CustomProviderListItemProps {
  provider: CustomProvider;
  onUpdate: (updates: Partial<Omit<CustomProvider, "id">>) => void;
  onDelete: () => void;
}

export function CustomProviderListItem({
  provider,
  onUpdate,
  onDelete,
}: CustomProviderListItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const apiKeys = useAtomValue(customProviderApiKeysAtom);
  const setApiKey = useSetAtom(setCustomProviderApiKeyAtom);
  const apiKey = apiKeys[provider.id] ?? "";

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
              <Badge>Custom</Badge>
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

            <div className="flex flex-col gap-2">
              <Label htmlFor={`api-key-${provider.id}`} className="text-xs">
                API Key
              </Label>
              <SecretInput
                id={`api-key-${provider.id}`}
                value={apiKey}
                onChange={(key) => setApiKey(provider.id, key)}
                placeholder="Enter API key if required"
                showSaveCancel
              />
            </div>

            <HttpHeadersEditor
              id={provider.id}
              headers={provider.headers}
              onChange={(headers) => onUpdate({ headers })}
              labelClassName="text-xs"
            />

            <ModelList
              models={provider.models}
              baseUrl={provider.baseUrl}
              apiKey={apiKey}
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
