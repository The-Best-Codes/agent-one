import {
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  LoaderIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react";
import { useState } from "react";

import { HttpHeadersEditor } from "@/components/a1/input/http-headers-editor";
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
import { Toggle } from "@/components/ui/toggle";
import type { CustomProviderModel } from "@/lib/jotai/custom-provider-atoms";
import { fetchProviderModels } from "@/lib/providers/custom-provider-factory";

interface AddOpenAICompatibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: {
    name: string;
    baseUrl: string;
    apiKey: string;
    headers: Record<string, string>;
    models: CustomProviderModel[];
  }) => void;
}

export function AddOpenAICompatibleDialog({
  open,
  onOpenChange,
  onAdd,
}: AddOpenAICompatibleDialogProps) {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [models, setModels] = useState<CustomProviderModel[]>([]);

  const [isAddingModel, setIsAddingModel] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelSupportsTools, setNewModelSupportsTools] = useState(true);
  const [newModelSupportsImages, setNewModelSupportsImages] = useState(false);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const isValid = name.trim() !== "" && baseUrl.trim() !== "";
  const isNewModelValid =
    newModelId.trim() !== "" && !models.some((m) => m.id === newModelId.trim());

  const resetForm = () => {
    setName("");
    setBaseUrl("");
    setApiKey("");
    setShowKey(false);
    setHeaders({});
    setModels([]);
    setIsAddingModel(false);
    setNewModelId("");
    setNewModelName("");
    setNewModelSupportsTools(true);
    setNewModelSupportsImages(false);
    setFetchError(null);
  };

  const handleAdd = () => {
    if (!isValid) return;

    onAdd({
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      headers,
      models,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleAddModel = () => {
    if (!isNewModelValid) return;

    setModels([
      ...models,
      {
        id: newModelId.trim(),
        name: newModelName.trim() || undefined,
        supportsTools: newModelSupportsTools,
        supportsImages: newModelSupportsImages,
      },
    ]);

    setNewModelId("");
    setNewModelName("");
    setNewModelSupportsTools(true);
    setNewModelSupportsImages(false);
    setIsAddingModel(false);
  };

  const handleDeleteModel = (id: string) => {
    setModels(models.filter((m) => m.id !== id));
  };

  const handleToggleTools = (id: string) => {
    setModels(
      models.map((m) =>
        m.id === id ? { ...m, supportsTools: !m.supportsTools } : m,
      ),
    );
  };

  const handleToggleImages = (id: string) => {
    setModels(
      models.map((m) =>
        m.id === id ? { ...m, supportsImages: !m.supportsImages } : m,
      ),
    );
  };

  const handleFetchModels = async () => {
    if (!baseUrl.trim()) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      const response = await fetchProviderModels(
        baseUrl.trim(),
        apiKey.trim() || undefined,
        headers,
      );

      const existingIds = new Set(models.map((m) => m.id));
      const newModels: CustomProviderModel[] = response.data
        .filter((m) => !existingIds.has(m.id))
        .map((m) => ({
          id: m.id,
          name: undefined,
          supportsTools: true,
          supportsImages: false,
        }));

      if (newModels.length > 0) {
        setModels([...models, ...newModels]);
      }
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Failed to fetch models",
      );
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label htmlFor="provider-api-key">API Key (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="provider-api-key"
                type={showKey ? "text" : "password"}
                placeholder="Enter API key if required"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
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
            </div>
          </div>

          <HttpHeadersEditor
            id="new-provider"
            headers={headers}
            onChange={setHeaders}
          />

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Models</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchModels}
                  disabled={isFetching || !baseUrl.trim()}
                >
                  {isFetching ? (
                    <LoaderIcon className="size-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="size-4" />
                  )}
                  Auto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingModel(true)}
                  disabled={isAddingModel}
                >
                  <PlusIcon className="size-4" />
                  Add
                </Button>
              </div>
            </div>

            {fetchError && (
              <p className="text-destructive text-xs">{fetchError}</p>
            )}

            {models.length > 0 && (
              <div className="border-border flex max-h-48 flex-col divide-y overflow-y-auto rounded-md border">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {model.name || model.id}
                      </p>
                      {model.name && (
                        <p className="text-muted-foreground truncate text-xs">
                          {model.id}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Toggle
                        size="sm"
                        pressed={model.supportsTools}
                        onPressedChange={() => handleToggleTools(model.id)}
                        title="Toggle tool support"
                        aria-label="Toggle tool support"
                      >
                        <WrenchIcon className="size-3" />
                      </Toggle>

                      <Toggle
                        size="sm"
                        pressed={model.supportsImages}
                        onPressedChange={() => handleToggleImages(model.id)}
                        title="Toggle image support"
                        aria-label="Toggle image support"
                      >
                        <ImageIcon className="size-3" />
                      </Toggle>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleDeleteModel(model.id)}
                      >
                        <Trash2Icon className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {models.length === 0 && !isAddingModel && (
              <p className="text-muted-foreground rounded-md border border-dashed py-4 text-center text-xs">
                No models configured. Fetch models or add them manually.
              </p>
            )}

            {isAddingModel && (
              <div className="bg-muted/50 flex flex-col gap-3 rounded-md p-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="new-model-id" className="text-xs">
                      Model ID
                    </Label>
                    <Input
                      id="new-model-id"
                      value={newModelId}
                      onChange={(e) => setNewModelId(e.target.value)}
                      placeholder="e.g., gpt-4"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="new-model-name" className="text-xs">
                      Display Name (optional)
                    </Label>
                    <Input
                      id="new-model-name"
                      value={newModelName}
                      onChange={(e) => setNewModelName(e.target.value)}
                      placeholder="e.g., GPT-4"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Toggle
                    size="sm"
                    pressed={newModelSupportsTools}
                    onPressedChange={setNewModelSupportsTools}
                    aria-label="Supports tools"
                  >
                    <WrenchIcon className="size-3" />
                    Tools
                  </Toggle>

                  <Toggle
                    size="sm"
                    pressed={newModelSupportsImages}
                    onPressedChange={setNewModelSupportsImages}
                    aria-label="Supports images"
                  >
                    <ImageIcon className="size-3" />
                    Images
                  </Toggle>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingModel(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddModel}
                    disabled={!isNewModelValid}
                  >
                    Add Model
                  </Button>
                </div>
              </div>
            )}
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
