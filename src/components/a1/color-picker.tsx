import { IconCheck, IconPencil } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ColorPickerOption = {
  value: string;
  label: string;
  className: string;
};

type ColorPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly ColorPickerOption[];
  label: string;
};

export function ColorPicker({ value, onValueChange, options, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const activeOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="relative overflow-hidden rounded-lg p-0"
          aria-label={`${label}: ${activeOption?.label}`}
          title={activeOption?.label}
        >
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              activeOption?.className,
            )}
          >
            <IconPencil className="size-4" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-fit p-2">
        <div className="grid grid-cols-6 gap-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              title={option.label}
              aria-label={option.label}
              onClick={() => onValueChange(option.value)}
              className={cn(
                "flex size-8 items-center justify-center rounded-md outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50",
                option.className,
              )}
            >
              {option.value === value && <IconCheck className="size-4" data-icon="inline-start" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
