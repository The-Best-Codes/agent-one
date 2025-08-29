"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const AT_BOTTOM_THRESHOLD = 10;

export interface AutoScrollContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  scrollableClassName?: string;
  scrollButtonClassName?: string;
  scrollButtonChildren?: ReactNode;
  scrollButtonProps?: Omit<
    React.ComponentProps<"button">,
    "className" | "children" | "onClick"
  >;
  behavior?: "smooth" | "instant";
  /** Whether to watch resize events on the container. Defaults to false for performance. */
  watchResize?: boolean;
  /** Distance from bottom (in px) where button starts sliding out. Defaults to 50px. */
  slideStartDistance?: number;
  /** Distance from bottom (in px) where button is fully hidden. Defaults to 10px. */
  slideEndDistance?: number;
}

export type AutoScrollHandle = {
  scrollToBottom: () => void;
};

export const AutoScrollContainer = forwardRef<
  AutoScrollHandle,
  AutoScrollContainerProps
>(
  (
    {
      children,
      className,
      scrollableClassName,
      scrollButtonClassName,
      scrollButtonChildren,
      scrollButtonProps,
      behavior = "instant",
      watchResize = false,
      slideStartDistance = 50,
      slideEndDistance = 10,
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [buttonOffset, setButtonOffset] = useState(0);
    const isAtBottomRef = useRef(true);

    const scrollToBottom = useCallback(
      (scrollBehavior: "smooth" | "instant" = behavior) => {
        const container = containerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: scrollBehavior,
          });
        }
      },
      [behavior],
    );

    const handleScrollButtonClick = () => {
      isAtBottomRef.current = true;
      setButtonOffset(0);
      scrollToBottom("smooth");
    };

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => {
          isAtBottomRef.current = true;
          setButtonOffset(0);
          scrollToBottom();
        },
      }),
      [scrollToBottom],
    );

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const atBottom = distanceFromBottom <= AT_BOTTOM_THRESHOLD;

        isAtBottomRef.current = atBottom;

        let offset = 0;
        if (distanceFromBottom <= slideStartDistance) {
          if (distanceFromBottom <= slideEndDistance) {
            offset = 60;
          } else {
            const slideRange = slideStartDistance - slideEndDistance;
            const slideProgress =
              (slideStartDistance - distanceFromBottom) / slideRange;
            offset = slideProgress * 60;
          }
        }

        setButtonOffset(offset);
      };

      const observerCallback = () => {
        if (isAtBottomRef.current) {
          scrollToBottom("instant");
        }
      };

      scrollToBottom("instant");

      const mutationObserver = new MutationObserver(observerCallback);
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
      });

      let resizeObserver: ResizeObserver | undefined;
      if (watchResize) {
        resizeObserver = new ResizeObserver(observerCallback);
        resizeObserver.observe(container);
      }

      container.addEventListener("scroll", handleScroll, { passive: true });

      handleScroll();

      return () => {
        mutationObserver.disconnect();
        resizeObserver?.disconnect();
        container.removeEventListener("scroll", handleScroll);
      };
    }, [scrollToBottom, slideEndDistance, slideStartDistance, watchResize]);

    return (
      <div className={cn("relative h-full w-full", className)} {...props}>
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto"
          data-testid="auto-scroll-container-scrollable"
        >
          <div className={scrollableClassName}>{children}</div>
        </div>
        <div className="pointer-events-none absolute right-4 bottom-2 z-10 overflow-hidden">
          <Button
            data-testid="scroll-to-bottom"
            size="icon"
            onClick={handleScrollButtonClick}
            className={cn(
              "pointer-events-auto transition-transform duration-200 will-change-transform hover:opacity-75",
              scrollButtonClassName,
            )}
            style={{
              transform: `translateY(${buttonOffset}px)`,
            }}
            variant="secondary"
            aria-label="Scroll to bottom"
            {...scrollButtonProps}
          >
            {scrollButtonChildren || (
              <ChevronDown data-testid="scroll-to-bottom-icon" />
            )}
          </Button>
        </div>
      </div>
    );
  },
);

AutoScrollContainer.displayName = "AutoScrollContainer";
