import { useVirtualizer } from "@tanstack/react-virtual";
import fuzzysort from "fuzzysort";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { type FC, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

type VirtualRow = { type: "heading"; provider: string } | { type: "item"; model: ModelData };

interface ModelListProps {
  rows: VirtualRow[];
  currentModel: ModelData | undefined;
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
  searchQuery: string;
  onSelect: (modelId: string) => void;
  setSearchQuery: (value: string) => void;
}

const ModelList: FC<ModelListProps> = ({
  rows,
  currentModel,
  parentRef,
  virtualizer,
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
      {rows.length === 0 ? (
        <CommandEmpty>No model found.</CommandEmpty>
      ) : (
        <CommandGroup>
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const row = rows[virtualItem.index];
              if (row.type === "heading") {
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="text-muted-foreground px-2 pt-1.5 text-xs font-medium"
                  >
                    {row.provider}
                  </div>
                );
              }
              const { model } = row;
              const isSelected = currentModel?.id === model.id;
              return (
                <CommandItem
                  key={virtualItem.key}
                  value={model.id}
                  onSelect={() => onSelect(model.id)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="flex w-full min-w-0 flex-1 items-center justify-center gap-1">
                    {isSelected && <CheckIcon />}
                    <div className="scrollbar-size-xs w-full overflow-x-auto">
                      <span className="font-medium whitespace-nowrap">{model.name}</span>
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </div>
        </CommandGroup>
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
  const { AVAILABLE_ENABLED_CHAT_MODELS } = useModelCatalog();
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

  const enabledModels = AVAILABLE_ENABLED_CHAT_MODELS;
  const shouldShowLoadingSkeleton = loading && loadingDelayPassed;
  const effectiveDisabled = disabled || loading;
  const effectiveOpen = effectiveDisabled ? false : open;
  const displayedModel = loading ? (staleModel ?? currentModel) : currentModel;

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return enabledModels;
    }

    const query = searchQuery.toLowerCase();
    const scoredModels = enabledModels
      .map((model) => {
        const score = fuzzysort.single(query, [model.name, model?.id || ""].join(" "))?.score ?? 0;
        return { model, score };
      })
      .filter(({ score }) => score > 0);

    return scoredModels.sort((a, b) => b.score - a.score).map(({ model }) => model);
  }, [searchQuery, enabledModels]);

  const rows = useMemo<VirtualRow[]>(() => {
    const groups = new Map<string, ModelData[]>();
    for (const model of filteredModels) {
      const providerModels = groups.get(model.provider);
      if (providerModels) {
        providerModels.push(model);
      } else {
        groups.set(model.provider, [model]);
      }
    }

    const result: VirtualRow[] = [];
    const entries = Array.from(groups.entries());
    entries.forEach(([provider, models]) => {
      result.push({ type: "heading", provider });
      for (const model of models) {
        result.push({ type: "item", model });
      }
    });
    return result;
  }, [filteredModels]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      if (row.type === "heading") return 24;
      return 32;
    },
    overscan: 10,
  });

  // Read https://react.dev/learn/separating-events-from-effects#extracting-non-reactive-logic-out-of-effects for more info about useEffectEvent
  const measureVirtualizer = useEffectEvent(() => {
    if (effectiveOpen) {
      const frame = requestAnimationFrame(() => {
        virtualizer.measure();
      });
      return () => cancelAnimationFrame(frame);
    }
  });

  useEffect(() => {
    measureVirtualizer();
  }, [effectiveOpen]);

  const scrollToTop = useEffectEvent(() => {
    if (!effectiveOpen) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      parentRef.current?.scrollTo({ top: 0 });
      virtualizer.scrollToOffset(0);
    });

    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    scrollToTop();
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
    return (
      <Skeleton
        className={cn(
          "h-8 w-full bg-muted-foreground dark:bg-accent border border-border",
          className,
        )}
      />
    );
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
      <PopoverContent className={cn("w-full p-0", popoverClassName)}>
        <ModelList
          rows={rows}
          currentModel={currentModel}
          parentRef={parentRef}
          virtualizer={virtualizer}
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
      <DrawerContent className="bg-popover">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Select a model</DrawerTitle>
        </DrawerHeader>
        <div className="-mt-2 overflow-y-auto pb-4">
          <ModelList
            rows={rows}
            currentModel={currentModel}
            parentRef={parentRef}
            virtualizer={virtualizer}
            searchQuery={searchQuery}
            onSelect={handleSelect}
            setSearchQuery={setSearchQuery}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
