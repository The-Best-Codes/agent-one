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
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
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
      setShowScrollButton(false);
      scrollToBottom("smooth");
    };

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => {
          isAtBottomRef.current = true;
          setShowScrollButton(false);
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
        const atBottom =
          scrollHeight - scrollTop <= clientHeight + AT_BOTTOM_THRESHOLD;

        isAtBottomRef.current = atBottom;

        setShowScrollButton(!atBottom);
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
    }, [scrollToBottom, watchResize]);

    return (
      <div className={cn("relative h-full w-full", className)} {...props}>
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto"
          data-testid="auto-scroll-container-scrollable"
        >
          <div className={scrollableClassName}>{children}</div>
        </div>
        {showScrollButton && (
          <Button
            data-testid="scroll-to-bottom"
            size="icon"
            onClick={handleScrollButtonClick}
            className={cn(
              "absolute right-4 bottom-4 z-10 hover:opacity-75",
              scrollButtonClassName,
            )}
            variant="secondary"
            aria-label="Scroll to bottom"
            {...scrollButtonProps}
          >
            {scrollButtonChildren || (
              <ChevronDown data-testid="scroll-to-bottom-icon" />
            )}
          </Button>
        )}
      </div>
    );
  },
);

AutoScrollContainer.displayName = "AutoScrollContainer";
