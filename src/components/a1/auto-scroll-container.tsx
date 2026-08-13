"use client";
import { defaultRangeExtractor, type VirtualItem, useVirtualizer } from "@tanstack/react-virtual";
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

import { useOverflow } from "@/hooks/use-overflow";
import { cn } from "@/lib/utils";

import { ChatToBottomButton } from "./chat-to-bottom-button";

const AT_BOTTOM_THRESHOLD = 10;

export interface AutoScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  items?: readonly unknown[];
  renderItem?: (item: unknown, index: number) => ReactNode;
  getItemKey?: (index: number) => Key;
  estimateItemSize?: (index: number) => number;
  overscan?: number;
  keepMountedIndexes?: readonly number[];
  scrollButtonClassName?: string;
  buttonScrollBehavior?: "smooth" | "instant";
  scrollableClassName?: string;
  overflowingClassName?: string;
  behavior?: "smooth" | "instant";
}

export type AutoScrollHandle = {
  getScrollElement: () => HTMLDivElement | null;
  scrollToBottom: () => void;
  scrollToIndex: (index: number) => void;
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
      overflowingClassName,
      buttonScrollBehavior = "smooth",
      behavior = "instant",
      ...props
    },
    ref,
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const isOverflowing = useOverflow(parentRef);
    const [showButton, setShowButton] = useState(false);
    const atBottomRef = useRef(true);
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
      // We would like to use "transform" mode; however, it causes problems with the positioning of codeblock headers and full-screen MCP apps.
      directDomUpdatesMode: "position",
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

    useLayoutEffect(() => {
      if (!isVirtualized) return;

      virtualizer.shouldAdjustScrollPositionOnItemSizeChange = (
        item: VirtualItem,
        _delta,
        instance,
      ) => {
        const scrollOffset = (instance.scrollOffset ?? 0) + instance.scrollAdjustments;

        return item.end <= scrollOffset && instance.scrollDirection !== "backward";
      };

      return () => {
        virtualizer.shouldAdjustScrollPositionOnItemSizeChange = undefined;
      };
    }, [isVirtualized, virtualizer]);

    const handleScroll = useCallback(() => {
      const container = parentRef.current;
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const atBottom = distanceFromBottom <= AT_BOTTOM_THRESHOLD;

      atBottomRef.current = atBottom;
      setShowButton(isOverflowing && !atBottom);
    }, [isOverflowing]);

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
        if (atBottomRef.current) {
          container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
        }
        handleScroll();
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
        getScrollElement: () => parentRef.current,
        scrollToBottom: () => {
          setShowButton(false);
          atBottomRef.current = true;
          scrollToBottom();
        },
        scrollToIndex: (index) => {
          if (isVirtualized) {
            virtualizer.scrollToIndex(index, { align: "start", behavior: "smooth" });
            return;
          }

          const container = parentRef.current;
          const item = container?.querySelector<HTMLElement>(`[data-message-index="${index}"]`);
          if (!container || !item) return;

          const containerRect = container.getBoundingClientRect();
          const itemRect = item.getBoundingClientRect();
          container.scrollTo({
            top: container.scrollTop + itemRect.top - containerRect.top,
            behavior: "smooth",
          });
        },
      }),
      [isVirtualized, scrollToBottom, virtualizer],
    );

    const virtualItems = isVirtualized ? virtualizer.getVirtualItems() : [];

    return (
      <div
        className={cn("relative h-full w-full", className, isOverflowing && overflowingClassName)}
        {...props}
      >
        <div
          ref={parentRef}
          className="h-full w-full overflow-y-auto"
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
        {showButton && (
          <ChatToBottomButton onClick={handleScrollButtonClick} className={scrollButtonClassName} />
        )}
      </div>
    );
  },
);

AutoScrollContainer.displayName = "AutoScrollContainer";
