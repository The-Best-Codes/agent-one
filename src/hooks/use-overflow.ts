import { type RefObject, useLayoutEffect, useState } from "react";

type OverflowAxis = "x" | "y";

interface UseOverflowOptions {
  axis?: OverflowAxis;
  watch?: unknown;
}

export function useOverflow<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { axis = "y", watch }: UseOverflowOptions = {},
): boolean {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      const timeoutId = window.setTimeout(() => {
        setIsOverflowing(false);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const checkOverflow = () => {
      const nextIsOverflowing =
        axis === "x"
          ? element.scrollWidth > element.clientWidth
          : element.scrollHeight > element.clientHeight;

      setIsOverflowing((current) =>
        current === nextIsOverflowing ? current : nextIsOverflowing,
      );
    };

    let frameId: number | null = null;
    const scheduleCheck = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(checkOverflow);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(scheduleCheck);
    resizeObserver.observe(element);

    const mutationObserver = new MutationObserver(scheduleCheck);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [axis, ref, watch]);

  return isOverflowing;
}
