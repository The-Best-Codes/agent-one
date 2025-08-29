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
import { useChatStatus } from "@/contexts/use-chat/chat-hooks";
import { useModel } from "@/contexts/use-model/model-hooks";
import { AVAILABLE_MODELS } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState, type FC } from "react";

interface ModelSelectorProps {
  className?: string;
  popoverClassName?: string;
}

export const ModelSelector: FC<ModelSelectorProps> = ({
  className,
  popoverClassName,
}) => {
  const { currentModel, setModel } = useModel();
  const { status } = useChatStatus();
  const [open, setOpen] = useState(false);

  const isDisabled = status === "streaming";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className={cn("w-full justify-between", className)}
          aria-label={`Model: ${currentModel.name}`}
        >
          <div className="flex flex-row items-center">
            <span className="text-muted-foreground text-xs">
              {currentModel.provider}/
            </span>
            <span className="font-medium">{currentModel.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                  <div className="flex flex-row items-center">
                    <span className="text-muted-foreground text-xs">
                      {model.provider}/
                    </span>
                    <span className="font-medium">{model.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentModel.id === model.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
