import fuzzysort from "fuzzysort";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { type FC, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useModel } from "@/contexts/use-model/model-hooks";
import { type ModelData, useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CHAT_LOADING_DELAY_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  className?: string;
  popoverClassName?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface ModelListProps {
  groupedModels: Array<{ provider: string; models: ModelData[] }>;
  currentModel: ModelData | undefined;
  parentRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  onSelect: (modelId: string) => void;
  setSearchQuery: (value: string) => void;
}

const ModelList: FC<ModelListProps> = ({
  groupedModels,
  currentModel,
  parentRef,
  searchQuery,
  onSelect,
  setSearchQuery,
}) => (
  <Command shouldFilter={false}>
    <CommandInput
      placeholder="Search models..."
      className="h-9"
      value={searchQuery}
      onValueChange={setSearchQuery}
    />
    <CommandList ref={parentRef}>
      {groupedModels.length === 0 ? (
        <CommandEmpty>No model found.</CommandEmpty>
      ) : (
        groupedModels.map((group, groupIndex) => (
          <div key={group.provider}>
            <CommandGroup heading={group.provider}>
              {group.models.map((model) => {
                const isSelected = currentModel?.id === model.id;
                return (
                  <CommandItem key={model.id} value={model.id} onSelect={() => onSelect(model.id)}>
                    <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
                      {isSelected && <CheckIcon />}
                      <div className="scrollbar-size-xs w-full overflow-x-auto">
                        <span className="font-medium whitespace-nowrap">{model.name}</span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {groupIndex < groupedModels.length - 1 ? <CommandSeparator /> : null}
          </div>
        ))
      )}
    </CommandList>
  </Command>
);

export const ModelSelector: FC<ModelSelectorProps> = ({
  className,
  popoverClassName,
  disabled = false,
  loading = false,
}) => {
  const { currentModel, setModel } = useModel();
  const [open, setOpen] = useState(false);
  const [loadingDelayPassed, setLoadingDelayPassed] = useState(false);
  const [staleModel, setStaleModel] = useState(currentModel);
  const [searchQuery, setSearchQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { AVAILABLE_CHAT_MODELS_WITH_API_KEY } = useModelCatalog();
  const { isApiKeysLoading } = useApiKeys();

  if (!loading && staleModel !== currentModel) {
    setStaleModel(currentModel);
  }

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timer = setTimeout(() => {
      setLoadingDelayPassed(true);
    }, CHAT_LOADING_DELAY_MS);

    return () => {
      clearTimeout(timer);
      setLoadingDelayPassed(false);
    };
  }, [loading]);

  const modelsWithApiKey = AVAILABLE_CHAT_MODELS_WITH_API_KEY;
  const shouldShowLoadingSkeleton = loading && loadingDelayPassed;
  const effectiveDisabled = disabled || loading;
  const effectiveOpen = effectiveDisabled ? false : open;
  const displayedModel = loading ? (staleModel ?? currentModel) : currentModel;

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return modelsWithApiKey;
    }

    const query = searchQuery.toLowerCase();
    const scoredModels = modelsWithApiKey
      .map((model) => {
        const score = fuzzysort.single(query, [model.name, model?.id || ""].join(" "))?.score ?? 0;
        return { model, score };
      })
      .filter(({ score }) => score > 0);

    return scoredModels.sort((a, b) => b.score - a.score).map(({ model }) => model);
  }, [searchQuery, modelsWithApiKey]);

  const groupedModels = useMemo(() => {
    const groups = new Map<string, ModelData[]>();
    for (const model of filteredModels) {
      const providerModels = groups.get(model.provider);
      if (providerModels) {
        providerModels.push(model);
      } else {
        groups.set(model.provider, [model]);
      }
    }

    return Array.from(groups.entries()).map(([provider, models]) => ({ provider, models }));
  }, [filteredModels]);

  useEffect(() => {
    if (!effectiveOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      parentRef.current?.scrollTo({ top: 0 });
    });

    return () => cancelAnimationFrame(frame);
  }, [effectiveOpen, searchQuery]);

  const handleSelect = (modelId: string) => {
    setModel(modelId);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
    }
  };

  const triggerContent = displayedModel ? (
    <>
      <div className="min-w-0 flex-1">
        <div className="scrollbar-size-xs w-full overflow-x-auto" tabIndex={0}>
          <div className="w-full text-left whitespace-nowrap">
            <span className="text-muted-foreground text-xs">{displayedModel.provider}/</span>
            <span className="font-medium">{displayedModel.name}</span>
          </div>
        </div>
      </div>
      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
    </>
  ) : (
    <>
      <div className="min-w-0 flex-1">
        <span className="text-muted-foreground">No model selected</span>
      </div>
      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
    </>
  );

  const modelLabel = displayedModel ? `Model: ${displayedModel.name}` : "No model";

  if (isApiKeysLoading || shouldShowLoadingSkeleton) {
    return <Skeleton className={cn("h-9 w-full", className)} />;
  }

  return isDesktop ? (
    <Popover open={effectiveOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={effectiveOpen}
          className={cn("w-full justify-between", className)}
          aria-label={modelLabel}
          disabled={effectiveDisabled}
        >
          {triggerContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-full p-0", popoverClassName)}>
        <ModelList
          groupedModels={groupedModels}
          currentModel={currentModel}
          parentRef={parentRef}
          searchQuery={searchQuery}
          onSelect={handleSelect}
          setSearchQuery={setSearchQuery}
        />
      </PopoverContent>
    </Popover>
  ) : (
    <Drawer open={effectiveOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={effectiveOpen}
          className={cn("w-full justify-between", className)}
          aria-label={modelLabel}
          disabled={effectiveDisabled}
        >
          {triggerContent}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[70vh]" showHandle={false}>
        <ModelList
          groupedModels={groupedModels}
          currentModel={currentModel}
          parentRef={parentRef}
          searchQuery={searchQuery}
          onSelect={handleSelect}
          setSearchQuery={setSearchQuery}
        />
      </DrawerContent>
    </Drawer>
  );
};
