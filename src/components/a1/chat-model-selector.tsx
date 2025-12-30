import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import {
  type FC,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useModel } from "@/contexts/use-model/model-hooks";
import { useModelCatalog } from "@/hooks/ai/use-model-catalog";
import { type ModelData } from "@/hooks/ai/use-model-catalog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { commandScore } from "@/lib/command-score";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  className?: string;
  popoverClassName?: string;
}

interface ModelListProps {
  filteredModels: ModelData[];
  currentModel: ModelData;
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
  searchQuery: string;
  onSelect: (modelId: string) => void;
  setSearchQuery: (value: string) => void;
}

const ModelList: FC<ModelListProps> = ({
  filteredModels,
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
      {filteredModels.length === 0 ? (
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
              const model = filteredModels[virtualItem.index];
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
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    {currentModel.id === model.id && (
                      <CheckIcon className="size-4 shrink-0" />
                    )}
                    <div className="scrollbar-size-xs w-full overflow-x-auto">
                      <div className="whitespace-nowrap">
                        <span className="text-muted-foreground text-xs">
                          {model.provider}/
                        </span>
                        <span className="font-medium">{model.name}</span>
                      </div>
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
}) => {
  const { currentModel, setModel } = useModel();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const { AVAILABLE_CHAT_MODELS } = useModelCatalog();

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return AVAILABLE_CHAT_MODELS;
    }

    const query = searchQuery.toLowerCase();
    const scoredModels = AVAILABLE_CHAT_MODELS.map((model) => {
      const targetString = model.name;
      const score = commandScore(targetString, query, [model?.id || ""]);
      return { model, score };
    }).filter(({ score }) => score > 0);

    return scoredModels
      .sort((a, b) => b.score - a.score)
      .map(({ model }) => model);
  }, [searchQuery, AVAILABLE_CHAT_MODELS]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredModels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });

  // Read https://react.dev/learn/separating-events-from-effects#extracting-non-reactive-logic-out-of-effects for more info about useEffectEvent
  const measureVirtualizer = useEffectEvent(() => {
    if (open) {
      const frame = requestAnimationFrame(() => {
        virtualizer.measure();
      });
      return () => cancelAnimationFrame(frame);
    }
  });

  useEffect(() => {
    measureVirtualizer();
  }, [open]);

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

  const triggerContent = (
    <>
      <div className="min-w-0 flex-1">
        <div className="scrollbar-size-xs w-full overflow-x-auto" tabIndex={0}>
          <div className="w-full text-left whitespace-nowrap">
            <span className="text-muted-foreground text-xs">
              {currentModel.provider}/
            </span>
            <span className="font-medium">{currentModel.name}</span>
          </div>
        </div>
      </div>
      <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
    </>
  );

  return isDesktop ? (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          aria-label={`Model: ${currentModel.name}`}
        >
          {triggerContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-full p-0", popoverClassName)}>
        <ModelList
          filteredModels={filteredModels}
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
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          aria-label={`Model: ${currentModel.name}`}
        >
          {triggerContent}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[70vh]" showHandle={false}>
        <ModelList
          filteredModels={filteredModels}
          currentModel={currentModel}
          parentRef={parentRef}
          virtualizer={virtualizer}
          searchQuery={searchQuery}
          onSelect={handleSelect}
          setSearchQuery={setSearchQuery}
        />
      </DrawerContent>
    </Drawer>
  );
};
