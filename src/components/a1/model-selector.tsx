import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronsUpDown } from "lucide-react";
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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useModel } from "@/contexts/use-model/model-hooks";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import { commandScore } from "@/lib/command-score";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  className?: string;
  popoverClassName?: string;
}

export const ModelSelector: FC<ModelSelectorProps> = ({
  className,
  popoverClassName,
}) => {
  const { currentModel, setModel } = useModel();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return AVAILABLE_MODELS;
    }

    const query = searchQuery.toLowerCase();
    const scoredModels = AVAILABLE_MODELS.map((model) => {
      const targetString = `${model.provider}/${model.name}`;
      const score = commandScore(targetString, query, [model?.id || ""]);
      return { model, score };
    }).filter(({ score }) => score > 0);

    return scoredModels
      .sort((a, b) => b.score - a.score)
      .map(({ model }) => model);
  }, [searchQuery]);

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

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          aria-label={`Model: ${currentModel.name}`}
        >
          <div className="min-w-0 flex-1">
            <ScrollArea className="w-full">
              <div className="w-full text-left whitespace-nowrap">
                <span className="text-muted-foreground text-xs">
                  {currentModel.provider}/
                </span>
                <span className="font-medium">{currentModel.name}</span>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-full p-0", popoverClassName)}>
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
                      <div
                        key={virtualItem.key}
                        data-slot="command-item"
                        className={cn(
                          "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground hover:bg-accent hover:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                        )}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        onClick={() => handleSelect(model.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSelect(model.id);
                          }
                        }}
                        role="option"
                        aria-selected={currentModel.id === model.id}
                        data-selected={currentModel.id === model.id}
                        tabIndex={0}
                      >
                        <div className="min-w-0 flex-1">
                          <ScrollArea className="w-full">
                            <div className="whitespace-nowrap">
                              <span className="text-muted-foreground text-xs">
                                {model.provider}/
                              </span>
                              <span className="font-medium">{model.name}</span>
                            </div>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
