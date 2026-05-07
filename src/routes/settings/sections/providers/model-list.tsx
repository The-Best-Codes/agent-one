import {
  IconCheck,
  IconCircleX,
  IconPlus,
  IconRobot,
  IconSettings,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  fetchProviderModels,
  type OpenAIModelsResponse,
} from "@/lib/ai/providers/custom-provider-factory";
import {
  getProviderModelName,
  type ProviderModelMetadata,
} from "@/lib/ai/providers/provider-models";

interface ModelListProps {
  models: ProviderModelMetadata[];
  builtInModels?: ProviderModelMetadata[];
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  addButtonLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onChange: (models: ProviderModelMetadata[]) => void;
}

interface AddModelFormProps {
  existingIds: string[];
  builtInModelIds?: Set<string>;
  onAdd: (model: ProviderModelMetadata) => void;
  onCancel: () => void;
}

interface ModelConfigDialogProps {
  model: ProviderModelMetadata;
  builtInModel?: ProviderModelMetadata;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (model: ProviderModelMetadata) => void;
}

function normalizeOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
}

function AddModelForm({ existingIds, builtInModelIds, onAdd, onCancel }: AddModelFormProps) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [supportsText, setSupportsText] = useState(true);
  const [supportsTools, setSupportsTools] = useState(true);
  const [supportsImages, setSupportsImages] = useState(false);
  const [contextWindow, setContextWindow] = useState("");
  const [maxOutputTokens, setMaxOutputTokens] = useState("");

  const trimmedId = id.trim();
  const trimmedName = name.trim();
  const isDuplicate = existingIds.includes(trimmedId);
  const overridesBuiltIn = Boolean(trimmedId && builtInModelIds?.has(trimmedId));
  const parsedContextWindow = normalizeOptionalNumber(contextWindow);
  const parsedMaxOutputTokens = normalizeOptionalNumber(maxOutputTokens);
  const hasInvalidNumber = parsedContextWindow === null || parsedMaxOutputTokens === null;
  const isValid = trimmedId !== "" && !isDuplicate && !hasInvalidNumber;

  const handleAdd = () => {
    if (!isValid) {
      return;
    }

    onAdd({
      id: trimmedId,
      name: trimmedName || undefined,
      supportsText,
      supportsTools,
      supportsImages,
      contextWindow: parsedContextWindow ?? undefined,
      maxOutputTokens: parsedMaxOutputTokens ?? undefined,
    });
  };

  return (
    <div className="bg-muted/30 rounded-lg border p-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="new-model-id">Model ID</FieldLabel>
          <Input
            id="new-model-id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. gpt-5"
            aria-invalid={isDuplicate}
          />
          {isDuplicate ? (
            <FieldDescription className="text-destructive">
              Model ID already exists.
            </FieldDescription>
          ) : overridesBuiltIn ? (
            <FieldDescription>
              This matches a built-in model and will override its metadata.
            </FieldDescription>
          ) : (
            <FieldDescription>Use the provider's raw model identifier.</FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="new-model-name">Display Name</FieldLabel>
          <Input
            id="new-model-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional label shown in the model picker"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field data-invalid={parsedContextWindow === null || undefined}>
            <FieldLabel htmlFor="new-model-context-window">Context Window</FieldLabel>
            <Input
              id="new-model-context-window"
              value={contextWindow}
              onChange={(e) => setContextWindow(e.target.value)}
              placeholder="e.g. 200000"
              inputMode="numeric"
              aria-invalid={parsedContextWindow === null}
            />
            <FieldDescription>
              {parsedContextWindow === null
                ? "Enter a non-negative number."
                : "Optional token limit used in the app UI."}
            </FieldDescription>
          </Field>

          <Field data-invalid={parsedMaxOutputTokens === null || undefined}>
            <FieldLabel htmlFor="new-model-max-output">Max Output Tokens</FieldLabel>
            <Input
              id="new-model-max-output"
              value={maxOutputTokens}
              onChange={(e) => setMaxOutputTokens(e.target.value)}
              placeholder="e.g. 8192"
              inputMode="numeric"
              aria-invalid={parsedMaxOutputTokens === null}
            />
            <FieldDescription>
              {parsedMaxOutputTokens === null
                ? "Enter a non-negative number."
                : "Optional max output token metadata override."}
            </FieldDescription>
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="new-model-supports-text">Supports Text</FieldLabel>
            <Switch
              id="new-model-supports-text"
              checked={supportsText}
              onCheckedChange={setSupportsText}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="new-model-supports-tools">Supports Tools</FieldLabel>
            <Switch
              id="new-model-supports-tools"
              checked={supportsTools}
              onCheckedChange={setSupportsTools}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="new-model-supports-images">Supports Images</FieldLabel>
            <Switch
              id="new-model-supports-images"
              checked={supportsImages}
              onCheckedChange={setSupportsImages}
            />
          </Field>
        </div>
      </FieldGroup>

      <div className="mt-4 flex justify-end gap-2">
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

function ModelConfigDialog({ model, open, onOpenChange, onChange }: ModelConfigDialogProps) {
  const [contextWindowValue, setContextWindowValue] = useState(
    model.contextWindow?.toString() ?? "",
  );
  const [maxOutputTokensValue, setMaxOutputTokensValue] = useState(
    model.maxOutputTokens?.toString() ?? "",
  );

  const parsedContextWindow = normalizeOptionalNumber(contextWindowValue);
  const parsedMaxOutputTokens = normalizeOptionalNumber(maxOutputTokensValue);
  const isContextWindowInvalid = parsedContextWindow === null;
  const isMaxOutputTokensInvalid = parsedMaxOutputTokens === null;

  if ((model.contextWindow?.toString() ?? "") !== contextWindowValue) {
    setContextWindowValue(model.contextWindow?.toString() ?? "");
  }

  if ((model.maxOutputTokens?.toString() ?? "") !== maxOutputTokensValue) {
    setMaxOutputTokensValue(model.maxOutputTokens?.toString() ?? "");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getProviderModelName(model)}</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`model-name-${model.id}`}>Display Name</FieldLabel>
            <Input
              id={`model-name-${model.id}`}
              value={model.name ?? ""}
              onChange={(e) => onChange({ ...model, name: e.target.value.trim() || undefined })}
              placeholder="Optional label shown in the model picker"
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={isContextWindowInvalid || undefined}>
              <FieldLabel htmlFor={`model-context-window-${model.id}`}>Context Window</FieldLabel>
              <Input
                id={`model-context-window-${model.id}`}
                value={contextWindowValue}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setContextWindowValue(nextValue);
                  const parsed = normalizeOptionalNumber(nextValue);
                  if (parsed !== null) {
                    onChange({ ...model, contextWindow: parsed ?? undefined });
                  }
                }}
                inputMode="numeric"
                placeholder="Optional"
                aria-invalid={isContextWindowInvalid}
              />
              <FieldDescription>
                {isContextWindowInvalid ? "Enter a non-negative number." : "Shown in usage status."}
              </FieldDescription>
            </Field>

            <Field data-invalid={isMaxOutputTokensInvalid || undefined}>
              <FieldLabel htmlFor={`model-max-output-${model.id}`}>Max Output Tokens</FieldLabel>
              <Input
                id={`model-max-output-${model.id}`}
                value={maxOutputTokensValue}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setMaxOutputTokensValue(nextValue);
                  const parsed = normalizeOptionalNumber(nextValue);
                  if (parsed !== null) {
                    onChange({ ...model, maxOutputTokens: parsed ?? undefined });
                  }
                }}
                inputMode="numeric"
                placeholder="Optional"
                aria-invalid={isMaxOutputTokensInvalid}
              />
              <FieldDescription>
                {isMaxOutputTokensInvalid
                  ? "Enter a non-negative number."
                  : "Used when you want to override the built-in output limit."}
              </FieldDescription>
            </Field>
          </div>

          <div className="flex flex-col gap-4">
            <Field orientation="horizontal">
              <FieldLabel htmlFor={`model-supports-text-${model.id}`}>Supports Text</FieldLabel>
              <Switch
                id={`model-supports-text-${model.id}`}
                checked={model.supportsText}
                onCheckedChange={(checked) => onChange({ ...model, supportsText: checked })}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor={`model-supports-tools-${model.id}`}>Supports Tools</FieldLabel>
              <Switch
                id={`model-supports-tools-${model.id}`}
                checked={model.supportsTools}
                onCheckedChange={(checked) => onChange({ ...model, supportsTools: checked })}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor={`model-supports-images-${model.id}`}>Supports Images</FieldLabel>
              <Switch
                id={`model-supports-images-${model.id}`}
                checked={model.supportsImages}
                onCheckedChange={(checked) => onChange({ ...model, supportsImages: checked })}
              />
            </Field>
          </div>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}

interface ModelRowProps {
  model: ProviderModelMetadata;
  builtInModel?: ProviderModelMetadata;
  onChange: (model: ProviderModelMetadata) => void;
  onDelete: (modelId: string) => void;
}

function ModelRow({ model, builtInModel, onChange, onDelete }: ModelRowProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const isBuiltInOverride = Boolean(builtInModel);

  return (
    <>
      <div className="flex h-10 items-center gap-2 border-b px-1 last:border-b-0">
        <div className="min-w-0 flex-1">
          <span className="truncate text-sm font-medium">{getProviderModelName(model)}</span>
          {model.name ? (
            <span className="text-muted-foreground ml-2 truncate text-xs">{model.id}</span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setConfigOpen(true)}
            aria-label="Configure model"
          >
            <IconSettings />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="text-destructive hover:text-destructive size-8"
            onClick={() => onDelete(model.id)}
            aria-label={isBuiltInOverride ? "Remove override" : "Delete model"}
          >
            <IconTrash />
          </Button>
        </div>
      </div>

      <ModelConfigDialog
        model={model}
        builtInModel={builtInModel}
        open={configOpen}
        onOpenChange={setConfigOpen}
        onChange={onChange}
      />
    </>
  );
}

export function ModelList({
  models,
  builtInModels = [],
  baseUrl,
  apiKey = "",
  headers = {},
  addButtonLabel = "Add Model",
  emptyTitle = "No models configured",
  emptyDescription = "Add a model to make it available in the model picker.",
  onChange,
}: ModelListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [fetchState, setFetchState] = useState<"idle" | "fetching" | "success" | "error">("idle");

  const builtInModelMap = useMemo(
    () => new Map(builtInModels.map((model) => [model.id, model])),
    [builtInModels],
  );

  const sortedModels = useMemo(
    () =>
      [...models].sort((left, right) =>
        getProviderModelName(left).localeCompare(getProviderModelName(right)),
      ),
    [models],
  );

  const handleAddModel = (model: ProviderModelMetadata) => {
    onChange([model, ...models]);
    setIsAdding(false);
  };

  const handleUpdateModel = (nextModel: ProviderModelMetadata) => {
    onChange(models.map((model) => (model.id === nextModel.id ? nextModel : model)));
  };

  const handleDeleteModel = (id: string) => {
    onChange(models.filter((model) => model.id !== id));
  };

  const handleFetchModels = async () => {
    if (!baseUrl || fetchState !== "idle") {
      return;
    }

    setFetchState("fetching");

    try {
      const response: OpenAIModelsResponse = await fetchProviderModels(baseUrl, apiKey, headers);
      const existingIds = new Set(models.map((model) => model.id));
      const newModels = response.data
        .filter((model) => !existingIds.has(model.id))
        .map(
          (model): ProviderModelMetadata => ({
            id: model.id,
            supportsText: true,
            supportsTools: true,
            supportsImages: false,
          }),
        );

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

  const fetchIcon =
    fetchState === "fetching" ? (
      <Spinner />
    ) : fetchState === "success" ? (
      <IconCheck />
    ) : fetchState === "error" ? (
      <IconCircleX />
    ) : (
      <IconSparkles />
    );

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">Models</div>

        <div className="flex gap-2">
          {baseUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchModels}
              disabled={fetchState !== "idle"}
            >
              {fetchIcon}
              Auto
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <IconPlus data-icon="inline-start" />
            {addButtonLabel}
          </Button>
        </div>
      </div>

      {isAdding ? (
        <div className="mt-4">
          <AddModelForm
            existingIds={models.map((model) => model.id)}
            builtInModelIds={new Set(builtInModels.map((model) => model.id))}
            onAdd={handleAddModel}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      ) : null}

      {sortedModels.length > 0 ? (
        <div className="mt-3 max-h-80 overflow-y-auto">
          {sortedModels.map((model) => (
            <ModelRow
              key={model.id}
              model={model}
              builtInModel={builtInModelMap.get(model.id)}
              onChange={handleUpdateModel}
              onDelete={handleDeleteModel}
            />
          ))}
        </div>
      ) : !isAdding ? (
        <div className="mt-4">
          <Empty className="bg-muted/20 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconRobot />
              </EmptyMedia>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" variant="outline" onClick={() => setIsAdding(true)}>
                <IconPlus data-icon="inline-start" />
                {addButtonLabel}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : null}
    </div>
  );
}
