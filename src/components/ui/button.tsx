import { type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { buttonVariants } from "@/components/ui/variants/button";
import { type ButtonAnalytics, trackGoogleAnalyticsEvent } from "@/lib/google-analytics";
import { cn } from "@/lib/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  analytics,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    analytics?: ButtonAnalytics;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || !analytics) {
        return;
      }

      trackGoogleAnalyticsEvent(analytics.event, {
        component: "button",
        variant,
        size,
        ...analytics.params,
      });
    },
    [analytics, onClick, size, variant],
  );

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      onClick={handleClick}
    />
  );
}

export { Button };
