import {
  IconCheck,
  IconCircleX,
  IconPlus,
  IconRobot,
  IconSettings,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { trackSettingsInteraction } from "@/lib/google-analytics";

interface ModelListProps {
  models: ProviderModelMetadata[];
  builtInModels?: ProviderModelMetadata[];
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  autoFetchOnMount?: boolean;
  addButtonLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onChange: (models: ProviderModelMetadata[]) => void;
}

interface AddModelFormProps {
  existingIds: string[];
  builtInModelIds: Set<string>;
  onAdd: (model: ProviderModelMetadata) => void;
  onCancel: () => void;
}

interface ModelConfigDialogProps {
  model: ProviderModelMetadata;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (model: ProviderModelMetadata) => void;
}

interface ModelRowProps {
  model: ProviderModelMetadata;
  onChange: (model: ProviderModelMetadata) => void;
  onDelete: (modelId: string) => void;
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
  const { t } = useTranslation();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [supportsText, setSupportsText] = useState(true);
  const [supportsTools, setSupportsTools] = useState(true);
  const [supportsImages, setSupportsImages] = useState(false);
  const [supportsAttachments, setSupportsAttachments] = useState(false);
  const [contextWindow, setContextWindow] = useState("");
  const [maxOutputTokens, setMaxOutputTokens] = useState("");

  const trimmedId = id.trim();
  const trimmedName = name.trim();
  const isDuplicate = existingIds.includes(trimmedId);
  const overridesBuiltIn = trimmedId !== "" && builtInModelIds.has(trimmedId);
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
      supportsAttachments,
      contextWindow: parsedContextWindow ?? undefined,
      maxOutputTokens: parsedMaxOutputTokens ?? undefined,
    });

    trackSettingsInteraction("providers", "model_added", {
      model_id_length: trimmedId.length,
      overrides_built_in: overridesBuiltIn,
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
            onChange={(event) => setId(event.target.value)}
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
            onChange={(event) => setName(event.target.value)}
            placeholder={t("providers.optionalLabelPicker")}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field data-invalid={parsedContextWindow === null || undefined}>
            <FieldLabel htmlFor="new-model-context-window">Context Window</FieldLabel>
            <Input
              id="new-model-context-window"
              value={contextWindow}
              onChange={(event) => setContextWindow(event.target.value)}
              placeholder="e.g. 200000"
              inputMode="numeric"
              aria-invalid={parsedContextWindow === null}
            />
            <FieldDescription>
              {parsedContextWindow === null
                ? t("providers.enterNonNegative")
                : t("providers.optionalTokenLimit")}
            </FieldDescription>
          </Field>

          <Field data-invalid={parsedMaxOutputTokens === null || undefined}>
            <FieldLabel htmlFor="new-model-max-output">Max Output Tokens</FieldLabel>
            <Input
              id="new-model-max-output"
              value={maxOutputTokens}
              onChange={(event) => setMaxOutputTokens(event.target.value)}
              placeholder="e.g. 8192"
              inputMode="numeric"
              aria-invalid={parsedMaxOutputTokens === null}
            />
            <FieldDescription>
              {parsedMaxOutputTokens === null
                ? t("providers.enterNonNegative")
                : t("providers.optionalMaxOutput")}
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

          <Field orientation="horizontal">
            <FieldLabel htmlFor="new-model-supports-attachments">Supports Attachments</FieldLabel>
            <Switch
              id="new-model-supports-attachments"
              checked={supportsAttachments}
              onCheckedChange={setSupportsAttachments}
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
  const { t } = useTranslation();
  const [draft, setDraft] = useState(model);
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onChange(draft);
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getProviderModelName(draft)}</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`model-name-${model.id}`}>Display Name</FieldLabel>
            <Input
              id={`model-name-${model.id}`}
              value={draft.name ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  name: event.target.value.trim() || undefined,
                })
              }
              placeholder={t("providers.optionalLabelPicker")}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field data-invalid={isContextWindowInvalid || undefined}>
              <FieldLabel htmlFor={`model-context-window-${model.id}`}>Context Window</FieldLabel>
              <Input
                id={`model-context-window-${model.id}`}
                value={contextWindowValue}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setContextWindowValue(nextValue);

                  const parsed = normalizeOptionalNumber(nextValue);
                  if (parsed !== null) {
                    setDraft({
                      ...draft,
                      contextWindow: parsed ?? undefined,
                    });
                  }
                }}
                inputMode="numeric"
                placeholder={t("common.optional")}
                aria-invalid={isContextWindowInvalid}
              />
              <FieldDescription>
                {isContextWindowInvalid
                  ? t("providers.enterNonNegative")
                  : t("providers.shownInUsage")}
              </FieldDescription>
            </Field>

            <Field data-invalid={isMaxOutputTokensInvalid || undefined}>
              <FieldLabel htmlFor={`model-max-output-${model.id}`}>Max Output Tokens</FieldLabel>
              <Input
                id={`model-max-output-${model.id}`}
                value={maxOutputTokensValue}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setMaxOutputTokensValue(nextValue);

                  const parsed = normalizeOptionalNumber(nextValue);
                  if (parsed !== null) {
                    setDraft({
                      ...draft,
                      maxOutputTokens: parsed ?? undefined,
                    });
                  }
                }}
                inputMode="numeric"
                placeholder={t("common.optional")}
                aria-invalid={isMaxOutputTokensInvalid}
              />
              <FieldDescription>
                {isMaxOutputTokensInvalid
                  ? t("providers.enterNonNegative")
                  : t("providers.overrideOutputLimit")}
              </FieldDescription>
            </Field>
          </div>

          <div className="flex flex-col gap-4">
            <Field orientation="horizontal">
              <FieldLabel htmlFor={`model-supports-text-${model.id}`}>Supports Text</FieldLabel>
              <Switch
                id={`model-supports-text-${model.id}`}
                checked={draft.supportsText}
                onCheckedChange={(checked) => setDraft({ ...draft, supportsText: checked })}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor={`model-supports-tools-${model.id}`}>Supports Tools</FieldLabel>
              <Switch
                id={`model-supports-tools-${model.id}`}
                checked={draft.supportsTools}
                onCheckedChange={(checked) => setDraft({ ...draft, supportsTools: checked })}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor={`model-supports-images-${model.id}`}>Supports Images</FieldLabel>
              <Switch
                id={`model-supports-images-${model.id}`}
                checked={draft.supportsImages}
                onCheckedChange={(checked) => setDraft({ ...draft, supportsImages: checked })}
              />
            </Field>

            <Field orientation="horizontal">
              <FieldLabel htmlFor={`model-supports-attachments-${model.id}`}>
                Supports Attachments
              </FieldLabel>
              <Switch
                id={`model-supports-attachments-${model.id}`}
                checked={draft.supportsAttachments ?? false}
                onCheckedChange={(checked) => setDraft({ ...draft, supportsAttachments: checked })}
              />
            </Field>
          </div>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  );
}

const ModelRow = memo(function ModelRow({ model, onChange, onDelete }: ModelRowProps) {
  const { t } = useTranslation();
  const [configOpen, setConfigOpen] = useState(false);

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
            onClick={() => {
              trackSettingsInteraction("providers", "model_config_opened");
              setConfigOpen(true);
            }}
            aria-label={t("providers.configureModel")}
          >
            <IconSettings />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="text-destructive hover:text-destructive size-8"
            onClick={() => {
              trackSettingsInteraction("providers", "model_deleted");
              onDelete(model.id);
            }}
            aria-label={t("providers.deleteModel")}
          >
            <IconTrash />
          </Button>
        </div>
      </div>

      {configOpen ? (
        <ModelConfigDialog
          key={`${model.id}-${model.name ?? ""}-${model.contextWindow ?? ""}-${model.maxOutputTokens ?? ""}-${model.supportsText}-${model.supportsTools}-${model.supportsImages}-${model.supportsAttachments}`}
          model={model}
          open={configOpen}
          onOpenChange={setConfigOpen}
          onChange={onChange}
        />
      ) : null}
    </>
  );
});

export function ModelList({
  models,
  builtInModels = [],
  baseUrl,
  apiKey = "",
  headers = {},
  autoFetchOnMount = false,
  addButtonLabel,
  emptyTitle,
  emptyDescription,
  onChange,
}: ModelListProps) {
  const { t } = useTranslation();
  const resolvedAddButtonLabel = addButtonLabel ?? t("providers.addModel");
  const resolvedEmptyTitle = emptyTitle ?? t("providers.noModelsConfigured");
  const resolvedEmptyDescription = emptyDescription ?? t("providers.addModelPicker");
  const [isAdding, setIsAdding] = useState(false);
  const [fetchState, setFetchState] = useState<"idle" | "fetching" | "success" | "error">("idle");
  const fetchResetTimeoutRef = useRef<number | null>(null);
  const hasAutoFetchedRef = useRef(false);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (fetchResetTimeoutRef.current !== null) {
        window.clearTimeout(fetchResetTimeoutRef.current);
      }
    };
  }, []);

  const sortedModels = useMemo(
    () =>
      [...models].sort((left, right) =>
        getProviderModelName(left).localeCompare(getProviderModelName(right)),
      ),
    [models],
  );

  const builtInModelIds = useMemo(
    () => new Set(builtInModels.map((model) => model.id)),
    [builtInModels],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: sortedModels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    getItemKey: (index) => sortedModels[index]?.id ?? index,
    overscan: 8,
  });

  const setFetchStateWithReset = (state: "success" | "error") => {
    setFetchState(state);

    if (fetchResetTimeoutRef.current !== null) {
      window.clearTimeout(fetchResetTimeoutRef.current);
    }

    fetchResetTimeoutRef.current = window.setTimeout(() => {
      setFetchState("idle");
      fetchResetTimeoutRef.current = null;
    }, 2000);
  };

  const handleAddModel = (model: ProviderModelMetadata) => {
    onChange([model, ...models]);
    setIsAdding(false);
  };

  const handleUpdateModel = (nextModel: ProviderModelMetadata) => {
    onChange(models.map((model) => (model.id === nextModel.id ? nextModel : model)));
  };

  const handleDeleteModel = (modelId: string) => {
    onChange(models.filter((model) => model.id !== modelId));
  };

  const handleFetchModels = async () => {
    if (!baseUrl || fetchState !== "idle") {
      return;
    }

    setFetchState("fetching");

    try {
      const response: OpenAIModelsResponse = await fetchProviderModels(baseUrl, apiKey, headers);
      const existingIds = new Set(models.map((model) => model.id));
      const fetchedModels = response.data
        .filter((model) => !existingIds.has(model.id))
        .map(
          (model): ProviderModelMetadata => ({
            id: model.id,
            supportsText: true,
            supportsTools: true,
            supportsImages: false,
            supportsAttachments: false,
          }),
        );

      if (fetchedModels.length > 0) {
        onChange([...fetchedModels, ...models]);
      }

      trackSettingsInteraction("providers", "models_auto_fetched", {
        fetched_count: fetchedModels.length,
      });

      setFetchStateWithReset("success");
    } catch {
      setFetchStateWithReset("error");
    }
  };

  useEffect(() => {
    if (!autoFetchOnMount || !baseUrl || hasAutoFetchedRef.current) {
      return;
    }

    hasAutoFetchedRef.current = true;
    void handleFetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              analytics={{
                event: "settings_interaction",
                params: { section: "providers", control: "auto_fetch_models_clicked" },
              }}
            >
              {fetchIcon}
              Auto
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              trackSettingsInteraction("providers", "add_model_form_opened");
              setIsAdding(true);
            }}
          >
            <IconPlus data-icon="inline-start" />
            {resolvedAddButtonLabel}
          </Button>
        </div>
      </div>

      {isAdding ? (
        <div className="mt-4">
          <AddModelForm
            existingIds={models.map((model) => model.id)}
            builtInModelIds={builtInModelIds}
            onAdd={handleAddModel}
            onCancel={() => setIsAdding(false)}
          />
        </div>
      ) : null}

      {sortedModels.length > 0 ? (
        <div ref={parentRef} className="mt-3 max-h-80 overflow-y-auto">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const model = sortedModels[virtualItem.index];

              return (
                <div
                  key={model.id}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <ModelRow
                    model={model}
                    onChange={handleUpdateModel}
                    onDelete={handleDeleteModel}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : !isAdding ? (
        <div className="mt-4">
          <Empty className="bg-muted/20 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconRobot />
              </EmptyMedia>
              <EmptyTitle>{resolvedEmptyTitle}</EmptyTitle>
              <EmptyDescription>{resolvedEmptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  trackSettingsInteraction("providers", "add_model_form_opened");
                  setIsAdding(true);
                }}
              >
                <IconPlus data-icon="inline-start" />
                {resolvedAddButtonLabel}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : null}
    </div>
  );
}
