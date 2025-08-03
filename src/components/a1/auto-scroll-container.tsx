"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

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
}

export type AutoScrollHandle = {
  scrollToBottom: () => void;
};

const SCROLL_UP_THRESHOLD = 10;

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
      ...props
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAutoScrolling, setIsAutoScrolling] = useState(true);
    const lastScrollTopRef = useRef(0);

    const handleScrollButtonClick = () => {
      setIsAutoScrolling(true);
    };

    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom: () => {
          const container = containerRef.current;
          if (container) {
            setIsAutoScrolling(true);
            container.scrollTo({
              top: container.scrollHeight,
              behavior,
            });
          }
        },
      }),
      [behavior],
    );

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const scroll = () => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior,
        });
      };

      if (isAutoScrolling) {
        scroll();
      }

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const currentScrollTop = scrollTop;

        if (
          isAutoScrolling &&
          lastScrollTopRef.current - currentScrollTop > SCROLL_UP_THRESHOLD
        ) {
          setIsAutoScrolling(false);
        }

        const isAtBottom = scrollHeight - currentScrollTop <= clientHeight + 1;
        if (!isAutoScrolling && isAtBottom) {
          setIsAutoScrolling(true);
        }

        lastScrollTopRef.current = currentScrollTop;
      };

      const mutationObserver = new MutationObserver(() => {
        if (isAutoScrolling) {
          scroll();
        }
      });

      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
      });
      container.addEventListener("scroll", handleScroll, { passive: true });

      lastScrollTopRef.current = container.scrollTop;

      return () => {
        mutationObserver.disconnect();
        container.removeEventListener("scroll", handleScroll);
      };
    }, [isAutoScrolling, behavior]);

    return (
      <div className={cn("relative h-full w-full", className)} {...props}>
        <div ref={containerRef} className="h-full w-full overflow-y-auto">
          <div className={scrollableClassName}>{children}</div>
        </div>
        {!isAutoScrolling && (
          <Button
            data-testid="scroll-to-bottom"
            size="icon"
            onClick={handleScrollButtonClick}
            className={cn(
              "absolute bottom-4 right-4 z-10 hover:opacity-75",
              scrollButtonClassName,
            )}
            variant="default"
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
