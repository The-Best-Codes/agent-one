import { ChevronsUpDown } from "lucide-react";
import { type FC, useState } from "react";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useModel } from "@/contexts/use-model/model-hooks";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
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
        <Command>
          <CommandInput placeholder="Search models..." className="h-9" />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {AVAILABLE_MODELS.map((model) => (
                <CommandItem
                  key={model.id}
                  value={`${model.provider}/${model.name}`}
                  onSelect={(currentValue) => {
                    const selectedModel = AVAILABLE_MODELS.find(
                      (m) =>
                        `${m.provider}/${m.name}`.toLowerCase() ===
                          currentValue.toLowerCase() || m.id === currentValue,
                    );
                    if (selectedModel) {
                      setModel(selectedModel.id);
                      setOpen(false);
                    }
                  }}
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
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
