import {
  IconBrain,
  IconCheck,
  IconFilter,
  IconPaperclip,
  IconPhoto,
  IconSelector,
  IconTool,
} from "@tabler/icons-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import fuzzysort from "fuzzysort";
import { type FC, useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { ProviderLogo } from "@/components/a1/provider-logo";
import {
  AdaptivePopover,
  AdaptivePopoverContent,
  AdaptivePopoverTrigger,
} from "@/components/ui/adaptive-popover";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroupButton } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiKeys } from "@/contexts/use-api-keys/api-keys-hooks";
import { useModel } from "@/contexts/use-model/model-hooks";
import { useWebAuth } from "@/contexts/use-web-auth/web-auth-hooks";
import { type ModelData, useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { CHAT_LOADING_DELAY_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  className?: string;
  popoverClassName?: string;
  disabled?: boolean;
  loading?: boolean;
}

type VirtualRow =
  | { type: "heading"; provider: string; providerId: string }
  | { type: "item"; model: ModelData };

type ModelCapability = "images" | "tools" | "attachments" | "reasoning";

const MODEL_CAPABILITIES = [
  {
    id: "images",
    label: "Images",
    icon: IconPhoto,
    supports: (model: ModelData) => model.supportsImageInput,
  },
  {
    id: "tools",
    label: "Tools",
    icon: IconTool,
    supports: (model: ModelData) => model.supportsToolUse,
  },
  {
    id: "attachments",
    label: "Attachments",
    icon: IconPaperclip,
    supports: (model: ModelData) => model.supportsAttachments,
  },
  {
    id: "reasoning",
    label: "Reasoning",
    icon: IconBrain,
    supports: (model: ModelData) => model.supportsReasoning,
  },
] as const;

interface ModelListProps {
  rows: VirtualRow[];
  currentModel: ModelData | undefined;
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
  searchQuery: string;
  capabilityFilters: ModelCapability[];
  onSelect: (modelId: string) => void;
  setSearchQuery: (value: string) => void;
  setCapabilityFilters: (value: ModelCapability[]) => void;
}

const HEADING_HEIGHT = 24;
const ITEM_HEIGHT = 32;

const ModelList: FC<ModelListProps> = ({
  rows,
  currentModel,
  parentRef,
  virtualizer,
  searchQuery,
  capabilityFilters,
  onSelect,
  setSearchQuery,
  setCapabilityFilters,
}) => {
  const [stickyState, setStickyState] = useState<{
    provider: string;
    providerId: string;
    translateY: number;
    scrollbarWidth: number;
  } | null>(null);

  const headingOffsets = useMemo(() => {
    const offsets: { provider: string; providerId: string; offset: number }[] = [];
    let offset = 2;
    for (const row of rows) {
      if (row.type === "heading") {
        offsets.push({ provider: row.provider, providerId: row.providerId, offset });
      }
      offset += row.type === "heading" ? HEADING_HEIGHT : ITEM_HEIGHT;
    }
    return offsets;
  }, [rows]);

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const scrollTop = el.scrollTop;

    if (scrollTop <= 0) {
      setStickyState(null);
      return;
    }

    let currentHeading: { provider: string; providerId: string } | null = null;
    let nextHeadingOffset: number | null = null;

    for (let i = 0; i < headingOffsets.length; i++) {
      const h = headingOffsets[i];
      if (h.offset < scrollTop) {
        currentHeading = h;
        nextHeadingOffset = headingOffsets[i + 1]?.offset ?? null;
      }
    }

    if (!currentHeading) {
      setStickyState(null);
      return;
    }

    let translateY = 0;
    if (nextHeadingOffset !== null) {
      const distanceToNext = nextHeadingOffset - scrollTop;
      if (distanceToNext < HEADING_HEIGHT) {
        translateY = distanceToNext - HEADING_HEIGHT;
      }
    }

    const scrollbarWidth = el.offsetWidth - el.clientWidth;
    setStickyState({
      provider: currentHeading.provider,
      providerId: currentHeading.providerId,
      translateY,
      scrollbarWidth,
    });
  }, [parentRef, headingOffsets]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [parentRef, handleScroll]);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder="Search models..."
        className="h-9"
        value={searchQuery}
        onValueChange={setSearchQuery}
        endAddon={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton
                variant={capabilityFilters.length > 0 ? "default" : "ghost"}
                size="icon-xs"
                aria-label={`Filter models${capabilityFilters.length > 0 ? ` (${capabilityFilters.length} active)` : ""}`}
              >
                <IconFilter />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit max-w-full">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Only show models that support</DropdownMenuLabel>
                {MODEL_CAPABILITIES.map((capability) => {
                  const CapabilityIcon = capability.icon;
                  const isChecked = capabilityFilters.includes(capability.id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={capability.id}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        setCapabilityFilters(
                          checked === true
                            ? [...capabilityFilters, capability.id]
                            : capabilityFilters.filter((filter) => filter !== capability.id),
                        )
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      <CapabilityIcon />
                      {capability.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="relative overflow-hidden">
        {stickyState && (
          <div
            className="bg-popover text-muted-foreground pointer-events-none absolute top-0 left-0 z-10 px-3 pt-1.5 text-xs font-medium"
            style={{
              right: `${stickyState.scrollbarWidth}px`,
              transform: `translateY(${stickyState.translateY}px)`,
              height: `${HEADING_HEIGHT}px`,
            }}
          >
            {stickyState.provider}
          </div>
        )}
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
                  const supportedCapabilities = MODEL_CAPABILITIES.filter((capability) =>
                    capability.supports(model),
                  );
                  return (
                    <CommandItem
                      key={virtualItem.key}
                      value={model.id}
                      onSelect={() => onSelect(model.id)}
                      className="group/model"
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
                        {isSelected && <IconCheck />}
                        <ProviderLogo
                          id={model.providerId}
                          title={model.provider}
                          className="size-4!"
                          imageClassName="p-0"
                        />
                        <div className="scrollbar-size-xs w-full overflow-x-auto">
                          <span className="font-medium whitespace-nowrap">{model.name}</span>
                        </div>
                        {supportedCapabilities.length > 0 && (
                          <div
                            className="text-muted-foreground flex shrink-0 items-center gap-0"
                            title={`Supports ${supportedCapabilities
                              .map((capability) => capability.label.toLowerCase())
                              .join(", ")}`}
                            aria-label={`Supports ${supportedCapabilities
                              .map((capability) => capability.label.toLowerCase())
                              .join(", ")}`}
                          >
                            {supportedCapabilities.map((capability) => {
                              const CapabilityIcon = capability.icon;
                              return (
                                <span
                                  key={capability.id}
                                  className="bg-popover ring-border -ml-3 flex size-5 items-center justify-center rounded-lg ring-1 transition-[margin] group-hover/model:-ml-1 group-focus/model:-ml-1 group-data-[selected=true]/model:-ml-1 first:ml-0"
                                  aria-hidden="true"
                                >
                                  <CapabilityIcon />
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </div>
            </CommandGroup>
          )}
        </CommandList>
      </div>
    </Command>
  );
};

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
  const [capabilityFilters, setCapabilityFilters] = useState<ModelCapability[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const { AVAILABLE_ENABLED_CHAT_MODELS } = useModelCatalog();
  const { isApiKeysLoading } = useApiKeys();
  const { user, isLoading: isAuthLoading, customerState } = useWebAuth();

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
    const modelsWithCapabilities = enabledModels.filter((model) =>
      capabilityFilters.every((capabilityId) =>
        MODEL_CAPABILITIES.find((capability) => capability.id === capabilityId)?.supports(model),
      ),
    );

    if (!searchQuery.trim()) return modelsWithCapabilities;

    const query = searchQuery.toLowerCase();
    const scoredModels = modelsWithCapabilities
      .map((model) => {
        const score = fuzzysort.single(query, [model.name, model?.id || ""].join(" "))?.score ?? 0;
        return { model, score };
      })
      .filter(({ score }) => score > 0);

    return scoredModels.sort((a, b) => b.score - a.score).map(({ model }) => model);
  }, [searchQuery, capabilityFilters, enabledModels]);

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
      result.push({ type: "heading", provider, providerId: models[0]?.providerId ?? provider });
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
      if (row.type === "heading") return HEADING_HEIGHT;
      return ITEM_HEIGHT;
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
  }, [effectiveOpen, searchQuery, capabilityFilters]);

  const handleSelect = (modelId: string) => {
    setModel(modelId);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setCapabilityFilters([]);
    }
  };

  const triggerContent = displayedModel ? (
    <>
      <div className="min-w-0 flex-1">
        <div className="scrollbar-size-xs scroll-fade-x w-full overflow-x-auto" tabIndex={0}>
          <div className="w-full text-left whitespace-nowrap">
            <span className="text-muted-foreground text-xs">{displayedModel.provider}/</span>
            <span className="font-medium">{displayedModel.name}</span>
          </div>
        </div>
      </div>
      <IconSelector className="size-4 shrink-0 opacity-50" />
    </>
  ) : (
    <>
      <div className="min-w-0 flex-1 text-left">
        <span className="text-muted-foreground">No model selected</span>
      </div>
      <IconSelector className="size-4 shrink-0 opacity-50" />
    </>
  );

  const modelLabel = displayedModel ? `Model: ${displayedModel.name}` : "No model";

  if (
    isApiKeysLoading ||
    isAuthLoading ||
    (Boolean(user) && !customerState) ||
    shouldShowLoadingSkeleton
  ) {
    return (
      <Skeleton
        className={cn(
          "h-8 w-full bg-muted-foreground dark:bg-accent border border-border",
          className,
        )}
      />
    );
  }

  return (
    <AdaptivePopover open={effectiveOpen} onOpenChange={handleOpenChange}>
      <AdaptivePopoverTrigger asChild>
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
      </AdaptivePopoverTrigger>
      <AdaptivePopoverContent
        title="Select a model"
        className={cn("w-full p-0", popoverClassName)}
        mobileClassName="-mt-2 px-0"
      >
        <ModelList
          rows={rows}
          currentModel={currentModel}
          parentRef={parentRef}
          virtualizer={virtualizer}
          searchQuery={searchQuery}
          capabilityFilters={capabilityFilters}
          onSelect={handleSelect}
          setSearchQuery={setSearchQuery}
          setCapabilityFilters={setCapabilityFilters}
        />
      </AdaptivePopoverContent>
    </AdaptivePopover>
  );
};
