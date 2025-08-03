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
        const currentScrollTop = container.scrollTop;
        if (isAutoScrolling && currentScrollTop < lastScrollTopRef.current) {
          setIsAutoScrolling(false);
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
      container.addEventListener("scroll", handleScroll);

      lastScrollTopRef.current = container.scrollTop;

      return () => {
        mutationObserver.disconnect();
        container.removeEventListener("scroll", handleScroll);
      };
    }, [isAutoScrolling, behavior]);

    return (
      <div
        ref={containerRef}
        className={cn("relative h-full w-full overflow-y-auto", className)}
        {...props}
      >
        <div className={scrollableClassName}>{children}</div>

        {!isAutoScrolling && (
          <Button
            data-testid="scroll-to-bottom"
            size="icon"
            onClick={handleScrollButtonClick}
            // TODO: Fix button positioning so it won't just scroll out of the viewport along with the content
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
