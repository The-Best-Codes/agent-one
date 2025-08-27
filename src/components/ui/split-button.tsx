import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { type VariantProps } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { buttonVariants } from "@/components/ui/variants/button";
import { cn } from "@/lib/utils";
import { getLogger } from "@/lib/logger";

const logger = getLogger(import.meta.url);

interface SplitButtonOption {
  id: string;
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface SplitButtonProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof buttonVariants> {
  options: SplitButtonOption[];
  defaultOptionId?: string;
  storageKey?: string;
  dropdownSideOffset?: number;
  dropdownAlign?: "start" | "center" | "end";
  dropdownSide?: "top" | "right" | "bottom" | "left";
}

function SplitButton({
  className,
  variant,
  size,
  options,
  defaultOptionId,
  storageKey,
  dropdownAlign,
  dropdownSideOffset,
  dropdownSide,
  disabled,
  ...props
}: SplitButtonProps) {
  const [selectedOptionId, setSelectedOptionId] = React.useState<string>(() => {
    if (!storageKey) {
      return defaultOptionId || options[0]?.id || "";
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && options.some((opt) => opt.id === stored)) {
        return stored;
      }
    } catch (error) {
      logger.warn("Failed to read from localStorage:", error);
    }

    return defaultOptionId || options[0]?.id || "";
  });

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.id === selectedOptionId) || options[0],
    [options, selectedOptionId],
  );

  const handleOptionSelect = React.useCallback(
    (optionId: string) => {
      setSelectedOptionId(optionId);

      if (storageKey) {
        try {
          localStorage.setItem(storageKey, optionId);
        } catch (error) {
          logger.warn("Failed to write to localStorage:", error);
        }
      }

      const option = options.find((opt) => opt.id === optionId);
      if (option && !option.disabled) {
        option.onClick();
      }
    },
    [options, storageKey],
  );

  const handleMainButtonClick = React.useCallback(() => {
    if (selectedOption && !selectedOption.disabled && !disabled) {
      selectedOption.onClick();
    }
  }, [selectedOption, disabled]);

  if (!selectedOption) {
    return null;
  }

  const baseButtonClasses = buttonVariants({ variant, size });
  const isDisabled = disabled || selectedOption.disabled;

  return (
    <div className="flex">
      <button
        className={cn(
          baseButtonClasses,
          "flex-1 rounded-r-none border-r-0",
          className,
        )}
        onClick={handleMainButtonClick}
        disabled={isDisabled}
        {...props}
      >
        {selectedOption.label}
      </button>
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            className={cn(
              baseButtonClasses,
              "rounded-l-none border-l border-l-white/20 px-2 dark:border-l-white/10",
              className,
            )}
            disabled={isDisabled}
            aria-label="More options"
          >
            <ChevronDownIcon className="size-4" />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            className={cn(
              "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            )}
            side={dropdownSide || "bottom"}
            sideOffset={dropdownSideOffset || 4}
            align={dropdownAlign || "end"}
          >
            {options.map((option) => (
              <DropdownMenuPrimitive.Item
                key={option.id}
                className={cn(
                  "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
                disabled={option.disabled}
                onSelect={() => handleOptionSelect(option.id)}
              >
                {option.label}
              </DropdownMenuPrimitive.Item>
            ))}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  );
}

export { SplitButton, type SplitButtonOption, type SplitButtonProps };
