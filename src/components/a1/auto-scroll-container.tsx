"use client";
import { IconChevronDown } from "@tabler/icons-react";
import {
  forwardRef,
  type ReactElement,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Virtualizer, type VirtualizerHandle } from "virtua";

import { Button } from "@/components/ui/button";
import { useOverflow } from "@/hooks/use-overflow";
import { cn } from "@/lib/utils";

const AT_BOTTOM_THRESHOLD = 10;
const BUTTON_HIDDEN_OFFSET = 36;

export interface AutoScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  virtualizedItems?: ReactElement[];
  virtualizedKeepMounted?: readonly number[];
  virtualizedBufferSize?: number;
  contentUpdateKey?: unknown;
  scrollableClassName?: string;
  scrollButtonClassName?: string;
  scrollButtonChildren?: ReactNode;
  scrollButtonProps?: Omit<React.ComponentProps<"button">, "className" | "children" | "onClick">;
  overflowingClassName?: string;
  behavior?: "smooth" | "instant";
  /** Scroll behavior for the scroll-to-bottom button. Defaults to "smooth". */
  buttonScrollBehavior?: "smooth" | "instant";
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

export const AutoScrollContainer = forwardRef<AutoScrollHandle, AutoScrollContainerProps>(
  (
    {
      children,
      virtualizedItems,
      virtualizedKeepMounted,
      virtualizedBufferSize,
      contentUpdateKey,
      className,
      scrollableClassName,
      scrollButtonClassName,
      scrollButtonChildren,
      scrollButtonProps,
      overflowingClassName,
      behavior = "instant",
      buttonScrollBehavior = "smooth",
      watchResize = false,
      slideStartDistance = 50,
      slideEndDistance = 10,
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const virtualizerRef = useRef<VirtualizerHandle>(null);
    const isOverflowing = useOverflow(containerRef);
    const [buttonOffset, setButtonOffset] = useState(BUTTON_HIDDEN_OFFSET);
    const isAtBottomRef = useRef(true);
    const isVirtualized = Boolean(virtualizedItems);
    const virtualizedItemCount = virtualizedItems?.length ?? 0;

    const scrollToBottom = useCallback(
      (scrollBehavior: "smooth" | "instant" = behavior) => {
        const container = containerRef.current;
        if (!container) return;

        if (isVirtualized && virtualizerRef.current && virtualizedItemCount > 0) {
          virtualizerRef.current.scrollToIndex(virtualizedItemCount - 1, {
            align: "end",
            smooth: false,
          });
          return;
        }

        container.scrollTo({
          top: container.scrollHeight,
          behavior: scrollBehavior,
        });
      },
      [behavior, isVirtualized, virtualizedItemCount],
    );

    const handleScrollButtonClick = () => {
      isAtBottomRef.current = true;
      setButtonOffset(BUTTON_HIDDEN_OFFSET);
      scrollToBottom(buttonScrollBehavior);
    };

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => {
          isAtBottomRef.current = true;
          setButtonOffset(BUTTON_HIDDEN_OFFSET);
          scrollToBottom();
        },
      }),
      [scrollToBottom],
    );

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      isAtBottomRef.current = true;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const atBottom = distanceFromBottom <= AT_BOTTOM_THRESHOLD;

        isAtBottomRef.current = atBottom;

        let offset = 0;
        if (isOverflowing) {
          if (distanceFromBottom <= slideStartDistance) {
            if (distanceFromBottom <= slideEndDistance) {
              offset = BUTTON_HIDDEN_OFFSET;
            } else {
              const slideRange = slideStartDistance - slideEndDistance;
              const slideProgress = (slideStartDistance - distanceFromBottom) / slideRange;
              offset = slideProgress * BUTTON_HIDDEN_OFFSET;
            }
          }
        } else {
          offset = BUTTON_HIDDEN_OFFSET;
        }

        setButtonOffset(offset);
      };

      const observerCallback = () => {
        if (isAtBottomRef.current) {
          scrollToBottom("instant");
          setButtonOffset(BUTTON_HIDDEN_OFFSET);
        } else {
          handleScroll();
        }
      };

      scrollToBottom("instant");

      let mutationObserver: MutationObserver | undefined;
      if (!isVirtualized) {
        mutationObserver = new MutationObserver(observerCallback);
        mutationObserver.observe(container, {
          childList: true,
          subtree: true,
        });
      }

      let resizeObserver: ResizeObserver | undefined;
      if (watchResize || isVirtualized) {
        resizeObserver = new ResizeObserver(observerCallback);
        resizeObserver.observe(isVirtualized ? contentRef.current || container : container);
      }

      container.addEventListener("scroll", handleScroll, { passive: true });

      handleScroll();

      return () => {
        mutationObserver?.disconnect();
        resizeObserver?.disconnect();
        container.removeEventListener("scroll", handleScroll);
      };
    }, [
      isOverflowing,
      isVirtualized,
      scrollToBottom,
      slideEndDistance,
      slideStartDistance,
      watchResize,
    ]);

    useLayoutEffect(() => {
      if (!isVirtualized) {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }

      if (isAtBottomRef.current) {
        scrollToBottom("instant");
        setButtonOffset(BUTTON_HIDDEN_OFFSET);
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      let offset = 0;
      if (isOverflowing) {
        if (distanceFromBottom <= slideStartDistance) {
          if (distanceFromBottom <= slideEndDistance) {
            offset = BUTTON_HIDDEN_OFFSET;
          } else {
            const slideRange = slideStartDistance - slideEndDistance;
            const slideProgress = (slideStartDistance - distanceFromBottom) / slideRange;
            offset = slideProgress * BUTTON_HIDDEN_OFFSET;
          }
        }
      } else {
        offset = BUTTON_HIDDEN_OFFSET;
      }

      setButtonOffset(offset);
    }, [
      contentUpdateKey,
      isOverflowing,
      isVirtualized,
      scrollToBottom,
      slideEndDistance,
      slideStartDistance,
    ]);

    return (
      <div
        className={cn("relative h-full w-full", className, isOverflowing && overflowingClassName)}
        {...props}
      >
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto"
          data-testid="auto-scroll-container-scrollable"
        >
          <div ref={contentRef} className={scrollableClassName}>
            {isVirtualized && virtualizedItems && virtualizedItems.length > 0 ? (
              <Virtualizer
                ref={virtualizerRef}
                scrollRef={containerRef}
                bufferSize={virtualizedBufferSize}
                keepMounted={virtualizedKeepMounted}
              >
                {virtualizedItems}
              </Virtualizer>
            ) : null}
            {children}
          </div>
        </div>
        <div className="pointer-events-none absolute right-4 bottom-2 z-10 overflow-hidden">
          <Button
            data-testid="scroll-to-bottom"
            size="icon"
            onClick={handleScrollButtonClick}
            className={cn(
              "pointer-events-auto transition-transform duration-200 hover:opacity-75",
              scrollButtonClassName,
            )}
            style={{
              transform: `translateY(${buttonOffset}px)`,
            }}
            variant="secondary"
            aria-label="Scroll to bottom"
            aria-hidden={buttonOffset >= BUTTON_HIDDEN_OFFSET}
            tabIndex={buttonOffset >= BUTTON_HIDDEN_OFFSET ? -1 : 0}
            {...scrollButtonProps}
          >
            {scrollButtonChildren || <IconChevronDown data-testid="scroll-to-bottom-icon" />}
          </Button>
        </div>
      </div>
    );
  },
);

AutoScrollContainer.displayName = "AutoScrollContainer";
