import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as React from "react";

import { cn } from "@/lib/utils";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
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

interface AccordionTriggerProps
  extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {
  /**
   * Optional custom icon to display. If not provided (undefined or null), no icon will be rendered.
   * You can pass any ReactNode here (e.g., `<ChevronDownIcon />`, `<YourCustomIcon />`, or a string).
   */
  icon?: React.ReactNode;
  /**
   * Position of the icon relative to the children content. Defaults to "right".
   * This prop is only effective if the `icon` prop is provided.
   */
  iconPosition?: "left" | "right";
  /**
   * Whether the icon should rotate when the accordion is open. Defaults to false.
   * This prop is only effective if the `icon` prop is provided.
   */
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
  const shouldRenderIcon = icon !== undefined && icon !== null;

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
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
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
