import * as React from "react";

import { cn } from "@/lib/utils";

interface AccordionContextValue {
  value: string[];
  onValueChange: (value: string) => void;
  type: "single" | "multiple";
  collapsible?: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

const useAccordionContext = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error(
      "Accordion components must be used within an <Accordion> provider",
    );
  }
  return context;
};

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionItemContext =
  React.createContext<AccordionItemContextValue | null>(null);

const useAccordionItemContext = () => {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error(
      "Accordion sub-components must be used within an <AccordionItem> provider",
    );
  }
  return context;
};

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

function Accordion({
  type = "single",
  collapsible = false,
  defaultValue,
  value: valueProp,
  onValueChange,
  ...props
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string[]>(
    defaultValue
      ? Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue]
      : [],
  );

  const isControlled = valueProp !== undefined;
  const currentValue = React.useMemo(() => {
    return isControlled
      ? Array.isArray(valueProp)
        ? valueProp
        : [valueProp]
      : internalValue;
  }, [isControlled, valueProp, internalValue]);

  const handleValueChange = React.useCallback(
    (itemValue: string) => {
      let newValue: string[];

      if (type === "multiple") {
        newValue = currentValue.includes(itemValue)
          ? currentValue.filter((v) => v !== itemValue)
          : [...currentValue, itemValue];
      } else {
        if (currentValue.includes(itemValue)) {
          newValue = collapsible ? [] : currentValue;
        } else {
          newValue = [itemValue];
        }
      }

      if (!isControlled) {
        setInternalValue(newValue);
      }

      if (onValueChange) {
        if (type === "multiple") {
          onValueChange(newValue);
        } else {
          onValueChange(newValue[0] ?? "");
        }
      }
    },
    [type, collapsible, currentValue, isControlled, onValueChange],
  );

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      onValueChange: handleValueChange,
      type,
      collapsible,
    }),
    [currentValue, handleValueChange, type, collapsible],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div data-slot="accordion" {...props} />
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps extends React.ComponentProps<"details"> {
  value: string;
}

function AccordionItem({ className, value, ...props }: AccordionItemProps) {
  const { value: openValues, onValueChange } = useAccordionContext();
  const isOpen = openValues.includes(value);

  const itemContextValue = React.useMemo(
    () => ({
      value,
      isOpen,
      onToggle: () => onValueChange(value),
    }),
    [value, isOpen, onValueChange],
  );

  return (
    <AccordionItemContext.Provider value={itemContextValue}>
      <details
        data-slot="accordion-item"
        className={cn(
          "accordion-details-animated border-b last:border-b-0",
          className,
        )}
        open={isOpen}
        {...props}
      />
    </AccordionItemContext.Provider>
  );
}

const AccordionTriggerIconWrapper = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-slot="accordion-icon"
    className={cn(
      "text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200",
      className,
    )}
    {...props}
  />
));
AccordionTriggerIconWrapper.displayName = "AccordionTriggerIconWrapper";

interface AccordionTriggerProps extends React.ComponentProps<"summary"> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  shouldRotateIcon?: boolean;
}

function AccordionTrigger({
  className,
  children,
  icon,
  iconPosition = "right",
  shouldRotateIcon = false,
  ...props
}: AccordionTriggerProps) {
  const { isOpen, onToggle } = useAccordionItemContext();
  const shouldRenderIcon = icon !== undefined && icon !== null;

  return (
    <summary
      data-slot="accordion-trigger"
      data-state={isOpen ? "open" : "closed"}
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex w-full cursor-pointer list-none items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
        shouldRotateIcon &&
          "[&[data-state=open]>[data-slot='accordion-icon']]:rotate-180",
        className,
      )}
      {...props}
    >
      {iconPosition === "left" && shouldRenderIcon && (
        <AccordionTriggerIconWrapper>{icon}</AccordionTriggerIconWrapper>
      )}
      {children}
      {iconPosition === "right" && shouldRenderIcon && (
        <AccordionTriggerIconWrapper>{icon}</AccordionTriggerIconWrapper>
      )}
    </summary>
  );
}

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  wrapperClassName?: string;
}

function AccordionContent({
  wrapperClassName,
  className,
  children,
  ...props
}: AccordionContentProps) {
  const { isOpen } = useAccordionItemContext();

  return (
    <div
      data-slot="accordion-content"
      data-state={isOpen ? "open" : "closed"}
      className={cn("text-sm", wrapperClassName)}
      {...props}
    >
      <div className={cn("overflow-hidden pt-0 pb-4", className)}>
        {children}
      </div>
    </div>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
