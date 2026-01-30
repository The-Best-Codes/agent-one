import { useVirtualizer } from "@tanstack/react-virtual";
import {
  CheckIcon,
  CircleXIcon,
  ImageIcon,
  Loader2Icon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import {
  fetchProviderModels,
  type OpenAIModelsResponse,
} from "@/lib/ai/providers/custom-provider-factory";
import type { CustomProviderModel } from "@/lib/jotai/custom-provider-atoms";

interface ModelListProps {
  models: CustomProviderModel[];
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
  onChange: (models: CustomProviderModel[]) => void;
}

interface AddModelFormProps {
  onAdd: (model: CustomProviderModel) => void;
  onCancel: () => void;
  existingIds: string[];
}

export interface ModelItemControlsProps {
  model: CustomProviderModel;
  onToggleTools: (id: string) => void;
  onToggleImages: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ModelItemControls({
  model,
  onToggleTools,
  onToggleImages,
  onDelete,
}: ModelItemControlsProps) {
  return (
    <div className="flex items-center gap-1">
      <Toggle
        size="sm"
        variant="outline"
        pressed={model.supportsTools}
        onPressedChange={() => onToggleTools(model.id)}
        title="Toggle tool support"
        aria-label="Toggle tool support"
      >
        <WrenchIcon />
      </Toggle>

      <Toggle
        size="sm"
        variant="outline"
        pressed={model.supportsImages}
        onPressedChange={() => onToggleImages(model.id)}
        title="Toggle image support"
        aria-label="Toggle image support"
      >
        <ImageIcon />
      </Toggle>

      <Button
        variant="destructive"
        size="icon"
        className="size-8"
        onClick={() => onDelete(model.id)}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

export interface ModelItemInfoProps {
  model: CustomProviderModel;
}

export function ModelItemInfo({ model }: ModelItemInfoProps) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium">{model.name || model.id}</p>
      {model.name && (
        <p className="text-muted-foreground truncate text-xs">{model.id}</p>
      )}
    </div>
  );
}

export function AddModelForm({
  onAdd,
  onCancel,
  existingIds,
}: AddModelFormProps) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [supportsTools, setSupportsTools] = useState(true);
  const [supportsImages, setSupportsImages] = useState(true);

  const isDuplicate = existingIds.includes(id.trim());
  const isValid = id.trim() !== "" && !isDuplicate;

  const handleAdd = () => {
    if (!isValid) return;
    onAdd({
      id: id.trim(),
      name: name.trim() || undefined,
      supportsTools,
      supportsImages,
    });
    setId("");
    setName("");
    setSupportsTools(true);
    setSupportsImages(true);
  };

  return (
    <div className="bg-muted/50 border-border flex flex-col gap-3 rounded-md border p-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="new-model-id" className="text-xs">
            Model ID
          </Label>
          <Input
            id="new-model-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g., gpt-5"
            className="mt-1"
          />
          {isDuplicate && (
            <p className="text-destructive mt-1 text-xs">
              Model ID already exists
            </p>
          )}
        </div>
        <div className="flex-1">
          <Label htmlFor="new-model-name" className="text-xs">
            Display Name
          </Label>
          <Input
            id="new-model-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., GPT 5.0"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Toggle
          size="sm"
          variant="outline"
          pressed={supportsTools}
          onPressedChange={setSupportsTools}
          aria-label="Supports tools"
        >
          {supportsTools ? <CheckIcon /> : <XIcon />}
          Supports Tools
        </Toggle>

        <Toggle
          size="sm"
          variant="outline"
          pressed={supportsImages}
          onPressedChange={setSupportsImages}
          aria-label="Supports images"
        >
          {supportsImages ? <CheckIcon /> : <XIcon />}
          Supports Images
        </Toggle>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!isValid}>
          Add Model
        </Button>
      </div>
    </div>
  );
}

const MODEL_ITEM_HEIGHT = 40;

export function ModelList({
  models,
  baseUrl,
  apiKey,
  headers,
  onChange,
}: ModelListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [fetchState, setFetchState] = useState<
    "idle" | "fetching" | "success" | "error"
  >("idle");
  const parentRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: models.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => MODEL_ITEM_HEIGHT,
    overscan: 5,
  });

  const handleAddModel = (model: CustomProviderModel) => {
    onChange([model, ...models]);
    setIsAdding(false);
  };

  const handleDeleteModel = (id: string) => {
    onChange(models.filter((m) => m.id !== id));
  };

  const handleToggleTools = (id: string) => {
    onChange(
      models.map((m) =>
        m.id === id ? { ...m, supportsTools: !m.supportsTools } : m,
      ),
    );
  };

  const handleToggleImages = (id: string) => {
    onChange(
      models.map((m) =>
        m.id === id ? { ...m, supportsImages: !m.supportsImages } : m,
      ),
    );
  };

  const handleFetchModels = async () => {
    if (!baseUrl || fetchState !== "idle") return;

    setFetchState("fetching");

    try {
      const response: OpenAIModelsResponse = await fetchProviderModels(
        baseUrl,
        apiKey,
        headers,
      );

      const existingIds = new Set(models.map((m) => m.id));
      const newModels: CustomProviderModel[] = response.data
        .filter((m) => !existingIds.has(m.id))
        .map((m) => ({
          id: m.id,
          name: undefined,
          supportsTools: true,
          supportsImages: true,
        }));

      if (newModels.length > 0) {
        onChange([...newModels, ...models]);
      }

      setFetchState("success");
      setTimeout(() => setFetchState("idle"), 2000);
    } catch {
      setFetchState("error");
      setTimeout(() => setFetchState("idle"), 2000);
    }
  };

  const getFetchIcon = () => {
    switch (fetchState) {
      case "idle":
        return <SparklesIcon />;
      case "fetching":
        return <Loader2Icon className="animate-spin" />;
      case "success":
        return <CheckIcon />;
      case "error":
        return <CircleXIcon />;
    }
  };

  const listHeight = Math.min(models.length * MODEL_ITEM_HEIGHT, 220);

  return (
    <div className="rounded-md border p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <Label className="text-xs">Models</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFetchModels}
            disabled={fetchState !== "idle" || !baseUrl}
          >
            {getFetchIcon()}
            Auto
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
          >
            <PlusIcon />
            Add
          </Button>
        </div>
      </div>

      {isAdding && (
        <div className="not-last:mb-3">
          <AddModelForm
            onAdd={handleAddModel}
            onCancel={() => setIsAdding(false)}
            existingIds={models.map((m) => m.id)}
          />
        </div>
      )}

      {models.length > 0 ? (
        <div
          ref={parentRef}
          className="border-border overflow-y-auto rounded-md border"
          style={{ height: listHeight }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const model = models[virtualItem.index];
              return (
                <div
                  key={model.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="flex h-full items-center gap-2 border-b px-3 last:border-b-0">
                    <ModelItemInfo model={model} />
                    <ModelItemControls
                      model={model}
                      onToggleTools={handleToggleTools}
                      onToggleImages={handleToggleImages}
                      onDelete={handleDeleteModel}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !isAdding && (
          <p className="text-muted-foreground flex h-9 flex-col items-center justify-center rounded-md border border-dashed p-2 text-sm">
            No models configured.
          </p>
        )
      )}
    </div>
  );
}
