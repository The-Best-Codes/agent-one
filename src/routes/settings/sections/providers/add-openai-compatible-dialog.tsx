import { useState } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
import { SecretInput } from "@/components/a1/input/secret-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProviderModelMetadata } from "@/lib/ai/providers/provider-models";

import { ModelList } from "./model-list";

interface NewProviderData {
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  models: ProviderModelMetadata[];
}

interface AddOpenAICompatibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: NewProviderData, apiKey: string) => void;
}

export function AddOpenAICompatibleDialog({
  open,
  onOpenChange,
  onAdd,
}: AddOpenAICompatibleDialogProps) {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [models, setModels] = useState<ProviderModelMetadata[]>([]);

  const isValid = name.trim() !== "" && baseUrl.trim() !== "" && models.length > 0;

  const resetForm = () => {
    setName("");
    setBaseUrl("");
    setApiKey("");
    setHeaders({});
    setModels([]);
  };

  const handleAdd = () => {
    if (!isValid) return;

    onAdd(
      {
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        headers,
        models,
      },
      apiKey.trim(),
    );

    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add OpenAI Compatible Provider</DialogTitle>
          <DialogDescription>
            Add a custom provider that uses the OpenAI API format.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
          <div className="py-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="provider-name">Name</FieldLabel>
                <Input
                  id="provider-name"
                  placeholder="e.g., My Local LLM"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="provider-base-url">Base URL</FieldLabel>
                <Input
                  id="provider-base-url"
                  placeholder="e.g., http://localhost:1234/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="provider-api-key">API Key</FieldLabel>
                <SecretInput
                  id="provider-api-key"
                  value={apiKey}
                  onChange={setApiKey}
                  placeholder="Enter API key if required"
                />
              </Field>

              <HttpHeadersEditor id="new-provider" headers={headers} onChange={setHeaders} />

              <ModelList
                models={models}
                baseUrl={baseUrl.trim()}
                apiKey={apiKey.trim()}
                headers={headers}
                emptyTitle="No custom models yet"
                emptyDescription="Add a model or fetch the provider’s model list, then edit the metadata you want AgentOne to use."
                onChange={setModels}
              />
            </FieldGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!isValid}>
            Add Provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
