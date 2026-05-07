import { IconTrash } from "@tabler/icons-react";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { SecretInput } from "@/components/a1/input/secret-input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/native/accordion";
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
        <AccordionTrigger className="px-3 hover:no-underline">
          <div className="flex flex-1 items-center justify-between gap-2 pr-2">
            <span>{provider.name}</span>
            <Switch
              id={`enabled-${provider.id}`}
              checked={provider.enabled}
              onCheckedChange={(checked) => onUpdate({ enabled: checked })}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Enable ${provider.name}`}
            />
          </div>
        </AccordionTrigger>
        <AccordionContent className="overflow-auto px-3 pb-3">
          <div className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={`name-${provider.id}`}>Name</FieldLabel>
                <Input
                  id={`name-${provider.id}`}
                  value={provider.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="Provider name"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`base-url-${provider.id}`}>Base URL</FieldLabel>
                <Input
                  id={`base-url-${provider.id}`}
                  value={provider.baseUrl}
                  onChange={(e) => onUpdate({ baseUrl: e.target.value })}
                  placeholder="e.g., http://localhost:1234/v1"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`api-key-${provider.id}`}>API Key</FieldLabel>
                <SecretInput
                  id={`api-key-${provider.id}`}
                  value={apiKey}
                  onChange={(key) => setApiKey(provider.id, key)}
                  placeholder="Enter API key if required"
                  showSaveCancel
                />
              </Field>
            </FieldGroup>

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
              <IconTrash data-icon="inline-start" />
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
