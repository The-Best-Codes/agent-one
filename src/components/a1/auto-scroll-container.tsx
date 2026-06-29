"use client";
import { IconChevronDown } from "@tabler/icons-react";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import {
  forwardRef,
  type Key,
  type ReactNode,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { useOverflow } from "@/hooks/use-overflow";
import { cn } from "@/lib/utils";

const AT_BOTTOM_THRESHOLD = 10;
const BUTTON_HIDDEN_OFFSET = 36;

export interface AutoScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  items?: readonly unknown[];
  renderItem?: (item: unknown, index: number) => ReactNode;
  getItemKey?: (index: number) => Key;
  estimateItemSize?: (index: number) => number;
  overscan?: number;
  keepMountedIndexes?: readonly number[];
  scrollButtonClassName?: string;
  scrollButtonChildren?: ReactNode;
  scrollButtonProps?: Omit<React.ComponentProps<"button">, "className" | "children" | "onClick">;
  buttonScrollBehavior?: "smooth" | "instant";
  scrollableClassName?: string;
  overflowingClassName?: string;
  behavior?: "smooth" | "instant";
  slideStartDistance?: number;
  slideEndDistance?: number;
}

export type AutoScrollHandle = {
  scrollToBottom: () => void;
};

export const AutoScrollContainer = forwardRef<AutoScrollHandle, AutoScrollContainerProps>(
  (
    {
      children,
      items,
      renderItem,
      getItemKey,
      estimateItemSize = () => 72,
      overscan = 5,
      keepMountedIndexes,
      className,
      scrollableClassName,
      scrollButtonClassName,
      scrollButtonChildren,
      scrollButtonProps,
      overflowingClassName,
      buttonScrollBehavior = "smooth",
      behavior = "instant",
      slideStartDistance = 50,
      slideEndDistance = AT_BOTTOM_THRESHOLD,
      ...props
    },
    ref,
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const isOverflowing = useOverflow(parentRef);
    const [buttonOffset, setButtonOffset] = useState(BUTTON_HIDDEN_OFFSET);
    const prevAtEndRef = useRef(true);
    const isVirtualized = items != null && items.length > 0;

    const virtualizer = useVirtualizer({
      count: isVirtualized ? items.length : 0,
      getScrollElement: () => parentRef.current,
      estimateSize: estimateItemSize,
      getItemKey,
      overscan,
      anchorTo: "end",
      followOnAppend: true,
      scrollEndThreshold: AT_BOTTOM_THRESHOLD,
      directDomUpdates: true,
      rangeExtractor:
        keepMountedIndexes && keepMountedIndexes.length > 0
          ? (range) => {
              const indexes = defaultRangeExtractor(range);
              const set = new Set(indexes);
              for (const idx of keepMountedIndexes) {
                set.add(idx);
              }
              return Array.from(set).sort((a, b) => a - b);
            }
          : undefined,
    });

    const handleScroll = useCallback(() => {
      const container = parentRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= AT_BOTTOM_THRESHOLD;

      prevAtEndRef.current = atBottom;

      let offset = BUTTON_HIDDEN_OFFSET;
      if (isOverflowing) {
        if (distanceFromBottom > slideStartDistance) {
          offset = 0;
        } else if (distanceFromBottom <= slideEndDistance) {
          offset = BUTTON_HIDDEN_OFFSET;
        } else {
          const slideRange = slideStartDistance - slideEndDistance;
          const slideProgress = (slideStartDistance - distanceFromBottom) / slideRange;
          offset = slideProgress * BUTTON_HIDDEN_OFFSET;
        }
      }

      setButtonOffset(offset);
    }, [isOverflowing, slideStartDistance, slideEndDistance]);

    useLayoutEffect(() => {
      const container = parentRef.current;
      if (!container) return;

      container.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();

      return () => {
        container.removeEventListener("scroll", handleScroll);
      };
    }, [handleScroll]);

    useLayoutEffect(() => {
      const container = parentRef.current;
      if (!container || isVirtualized) return;

      const observerCallback = () => {
        if (prevAtEndRef.current) {
          container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
          setButtonOffset(BUTTON_HIDDEN_OFFSET);
        } else {
          handleScroll();
        }
      };

      const mutationObserver = new MutationObserver(observerCallback);
      mutationObserver.observe(container, { childList: true, subtree: true });

      return () => {
        mutationObserver.disconnect();
      };
    }, [isVirtualized, handleScroll]);

    useLayoutEffect(() => {
      if (isVirtualized) {
        virtualizer.scrollToEnd({ behavior: "instant" });
      } else {
        parentRef.current?.scrollTo({ top: parentRef.current.scrollHeight, behavior: "instant" });
      }
    }, [isVirtualized, virtualizer]);

    const scrollToBottom = useCallback(
      (scrollBehavior: "smooth" | "instant" = behavior) => {
        if (isVirtualized) {
          virtualizer.scrollToEnd({ behavior: scrollBehavior });
        } else {
          parentRef.current?.scrollTo({
            top: parentRef.current.scrollHeight,
            behavior: scrollBehavior,
          });
        }
      },
      [isVirtualized, virtualizer, behavior],
    );

    const handleScrollButtonClick = () => {
      setButtonOffset(BUTTON_HIDDEN_OFFSET);
      if (isVirtualized) {
        virtualizer.scrollToEnd({ behavior: buttonScrollBehavior });
      } else {
        parentRef.current?.scrollTo({
          top: parentRef.current.scrollHeight,
          behavior: buttonScrollBehavior,
        });
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => {
          setButtonOffset(BUTTON_HIDDEN_OFFSET);
          scrollToBottom();
        },
      }),
      [scrollToBottom],
    );

    const virtualItems = isVirtualized ? virtualizer.getVirtualItems() : [];

    return (
      <div
        className={cn("relative h-full w-full", className, isOverflowing && overflowingClassName)}
        {...props}
      >
        <div
          ref={parentRef}
          className="scroll-fade h-full w-full overflow-y-auto"
          data-testid="auto-scroll-container-scrollable"
        >
          <div className={cn("min-h-full", scrollableClassName)}>
            {isVirtualized ? (
              <div ref={virtualizer.containerRef} style={{ position: "relative", width: "100%" }}>
                {virtualItems.map((virtualItem) => (
                  <div
                    key={virtualItem.key}
                    ref={virtualizer.measureElement}
                    data-index={virtualItem.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                    }}
                  >
                    {renderItem!(items![virtualItem.index], virtualItem.index)}
                  </div>
                ))}
              </div>
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
