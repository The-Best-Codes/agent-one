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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomProviderModel } from "@/lib/jotai/custom-provider-atoms";

import { ModelList } from "./model-list";

interface NewProviderData {
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  models: CustomProviderModel[];
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
  const [models, setModels] = useState<CustomProviderModel[]>([]);

  const isValid =
    name.trim() !== "" && baseUrl.trim() !== "" && models.length > 0;

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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add OpenAI Compatible Provider</DialogTitle>
          <DialogDescription>
            Add a custom provider that uses the OpenAI API format.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="provider-name">Name</Label>
            <Input
              id="provider-name"
              placeholder="e.g., My Local LLM"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="provider-base-url">Base URL</Label>
            <Input
              id="provider-base-url"
              placeholder="e.g., http://localhost:1234/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="provider-api-key">API Key</Label>
            <SecretInput
              id="provider-api-key"
              value={apiKey}
              onChange={setApiKey}
              placeholder="Enter API key if required"
            />
          </div>

          <HttpHeadersEditor
            id="new-provider"
            headers={headers}
            onChange={setHeaders}
          />

          <ModelList
            models={models}
            baseUrl={baseUrl.trim()}
            apiKey={apiKey.trim()}
            headers={headers}
            onChange={setModels}
          />
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
