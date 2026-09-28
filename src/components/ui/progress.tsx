import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  indeterminate = false,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & { indeterminate?: boolean }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={indeterminate ? null : value}
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-lg bg-muted",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "bg-primary h-full rounded-lg",
          indeterminate ? "w-1/4" : "w-full transition-all",
        )}
        style={
          indeterminate
            ? { animation: "progress-indeterminate 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite" }
            : { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
