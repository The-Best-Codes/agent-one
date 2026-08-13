import { createContext, useContext, useRef, useState } from "react";
import type { ComponentProps } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import useMobileDetection from "@/hooks/use-mobile-detection";

const HOLD_DELAY_MS = 500;
const HOLD_MOVE_THRESHOLD_PX = 10;

const MOBILE_DETECTION_OPTIONS = { pointerCoarse: true, match: "any" } as const;

const DEFAULT_CONTEXT = { isMobile: false, suppressClickRef: { current: false } };

const AdaptiveTooltipContext = createContext(DEFAULT_CONTEXT);

function AdaptiveTooltip({ children, ...props }: ComponentProps<typeof Tooltip>) {
  const isMobile = useMobileDetection(MOBILE_DETECTION_OPTIONS);
  const [open, setOpen] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const cancelHold = () => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    holdStartRef.current = null;
  };

  if (!isMobile) {
    return <Tooltip {...props}>{children}</Tooltip>;
  }

  return (
    <AdaptiveTooltipContext.Provider value={{ isMobile: true, suppressClickRef }}>
      <div
        className="contents"
        onPointerDownCapture={(event) => {
          suppressClickRef.current = false;
          if (holdTimerRef.current !== null || event.button !== 0) return;
          holdStartRef.current = { x: event.clientX, y: event.clientY };
          holdTimerRef.current = window.setTimeout(() => {
            holdTimerRef.current = null;
            holdStartRef.current = null;
            suppressClickRef.current = true;
            setOpen(true);
          }, HOLD_DELAY_MS);
        }}
        onPointerMoveCapture={(event) => {
          if (holdTimerRef.current === null || holdStartRef.current === null) return;
          const dx = event.clientX - holdStartRef.current.x;
          const dy = event.clientY - holdStartRef.current.y;
          if (Math.hypot(dx, dy) > HOLD_MOVE_THRESHOLD_PX) {
            cancelHold();
          }
        }}
        onPointerUpCapture={cancelHold}
        onPointerCancelCapture={cancelHold}
      >
        <Tooltip
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setOpen(false);
          }}
          {...props}
        >
          {children}
        </Tooltip>
      </div>
    </AdaptiveTooltipContext.Provider>
  );
}

function AdaptiveTooltipTrigger({ onClick, ...props }: ComponentProps<typeof TooltipTrigger>) {
  const { isMobile, suppressClickRef } = useContext(AdaptiveTooltipContext);

  if (isMobile) {
    return (
      <TooltipTrigger
        {...props}
        onClick={(event) => {
          onClick?.(event);
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            event.preventDefault();
          }
        }}
      />
    );
  }

  return <TooltipTrigger {...props} onClick={onClick} />;
}

function AdaptiveTooltipContent(props: ComponentProps<typeof TooltipContent>) {
  return <TooltipContent {...props} />;
}

export { AdaptiveTooltip, AdaptiveTooltipContent, AdaptiveTooltipTrigger };
