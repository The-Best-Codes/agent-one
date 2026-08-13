import { createContext, useContext } from "react";
import type { ComponentProps, ReactNode } from "react";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const ADAPTIVE_POPOVER_MEDIA_QUERY = "(min-width: 640px)";

const AdaptivePopoverContext = createContext(false);

interface AdaptivePopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function AdaptivePopover({ open, defaultOpen, onOpenChange, children }: AdaptivePopoverProps) {
  const isDesktop = useMediaQuery(ADAPTIVE_POPOVER_MEDIA_QUERY);

  return (
    <AdaptivePopoverContext.Provider value={isDesktop}>
      {isDesktop ? (
        <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
          {children}
        </Popover>
      ) : (
        <Drawer open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      )}
    </AdaptivePopoverContext.Provider>
  );
}

function AdaptivePopoverTrigger({ children, ...props }: ComponentProps<typeof PopoverTrigger>) {
  const isDesktop = useContext(AdaptivePopoverContext);
  const Trigger = isDesktop ? PopoverTrigger : DrawerTrigger;

  return <Trigger {...props}>{children}</Trigger>;
}

function AdaptivePopoverContent({
  title,
  className,
  align,
  side,
  sideOffset,
  mobileClassName,
  children,
  ...props
}: ComponentProps<typeof PopoverContent> & {
  title?: string;
  mobileClassName?: string;
}) {
  const isDesktop = useContext(AdaptivePopoverContext);

  if (isDesktop) {
    return (
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={className}
        {...props}
      >
        {children}
      </PopoverContent>
    );
  }

  return (
    <DrawerContent className="bg-popover">
      <DrawerHeader>
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
      </DrawerHeader>
      <div className={cn("overflow-y-auto px-4 pb-4", mobileClassName)}>{children}</div>
    </DrawerContent>
  );
}

export { AdaptivePopover, AdaptivePopoverContent, AdaptivePopoverTrigger };
