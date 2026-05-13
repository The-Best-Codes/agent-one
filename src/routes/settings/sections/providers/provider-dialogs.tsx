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
import { trackSettingsInteraction } from "@/lib/google-analytics";
import type { NewCustomProviderData } from "@/lib/jotai/custom-provider-atoms";

import { ModelList } from "./model-list";

interface AddOpenAICompatibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: NewCustomProviderData, apiKey: string) => void;
}

interface DeleteProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ProviderDraftState {
  name: string;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
  models: ProviderModelMetadata[];
}

const EMPTY_PROVIDER_DRAFT: ProviderDraftState = {
  name: "",
  baseUrl: "",
  apiKey: "",
  headers: {},
  models: [],
};

export function AddOpenAICompatibleDialog({
  open,
  onOpenChange,
  onAdd,
}: AddOpenAICompatibleDialogProps) {
  const [draft, setDraft] = useState<ProviderDraftState>(EMPTY_PROVIDER_DRAFT);

  const isValid =
    draft.name.trim() !== "" && draft.baseUrl.trim() !== "" && draft.models.length > 0;

  const resetForm = () => {
    setDraft(EMPTY_PROVIDER_DRAFT);
  };

  const handleAdd = () => {
    if (!isValid) {
      return;
    }

    onAdd(
      {
        name: draft.name.trim(),
        baseUrl: draft.baseUrl.trim(),
        headers: draft.headers,
        models: draft.models,
      },
      draft.apiKey.trim(),
    );

    trackSettingsInteraction("providers", "submit_add_provider_dialog", {
      has_api_key: Boolean(draft.apiKey.trim()),
      model_count: draft.models.length,
    });

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
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="provider-base-url">Base URL</FieldLabel>
                <Input
                  id="provider-base-url"
                  placeholder="e.g., http://localhost:1234/v1"
                  value={draft.baseUrl}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      baseUrl: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="provider-api-key">API Key</FieldLabel>
                <SecretInput
                  id="provider-api-key"
                  value={draft.apiKey}
                  onChange={(apiKey) =>
                    setDraft((current) => ({
                      ...current,
                      apiKey,
                    }))
                  }
                  placeholder="Enter API key if required"
                />
              </Field>

              <HttpHeadersEditor
                id="new-provider"
                headers={draft.headers}
                onChange={(headers) =>
                  setDraft((current) => ({
                    ...current,
                    headers,
                  }))
                }
              />

              <ModelList
                models={draft.models}
                baseUrl={draft.baseUrl.trim()}
                apiKey={draft.apiKey.trim()}
                headers={draft.headers}
                emptyTitle="No custom models yet"
                emptyDescription="Add a model or fetch the provider’s model list, then edit the metadata you want AgentOne to use."
                onChange={(models) =>
                  setDraft((current) => ({
                    ...current,
                    models,
                  }))
                }
              />
            </FieldGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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

export function DeleteProviderDialog({
  open,
  onOpenChange,
  providerName,
  onConfirm,
  onCancel,
}: DeleteProviderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Provider</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{providerName}&quot;? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
