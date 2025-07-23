"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
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
  smoothScroll?: boolean;
}

const AutoScrollContainerComponent = ({
  children,
  className,
  scrollableClassName,
  scrollButtonClassName,
  scrollButtonChildren,
  scrollButtonProps,
  smoothScroll,
  ...props
}: AutoScrollContainerProps) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  // Used to mark programmatic (auto) scrolling
  const isAutoScrollingRef = useRef(false);
  const userHasScrolledUpRef = useRef(userHasScrolledUp);
  userHasScrolledUpRef.current = userHasScrolledUp;

  const isScrolledToBottom = useCallback(() => {
    if (!contentRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    return Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!contentRef.current) return;
    isAutoScrollingRef.current = true;
    contentRef.current.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: smoothScroll ? "smooth" : "auto",
    });
  }, [smoothScroll]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    if (isAutoScrollingRef.current) {
      if (isScrolledToBottom()) {
        isAutoScrollingRef.current = false;
      } else {
        return;
      }
    }

    const atBottom = isScrolledToBottom();

    if (!atBottom) {
      setUserHasScrolledUp(true);
      setShowScrollButton(true);
    } else {
      setUserHasScrolledUp(false);
      setShowScrollButton(false);
    }
  }, [isScrolledToBottom]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    scrollToBottom();

    const observer = new MutationObserver(() => {
      if (!userHasScrolledUpRef.current) {
        scrollToBottom();
      }
    });

    observer.observe(contentEl, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [scrollToBottom]);

  return (
    <div className={cn("relative", className)} {...props}>
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className={cn("h-full w-full overflow-y-auto", scrollableClassName)}
      >
        {children}
      </div>

      {showScrollButton && (
        <Button
          size="icon"
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4 z-10 hover:opacity-75",
            scrollButtonClassName,
          )}
          variant="default"
          {...scrollButtonProps}
        >
          {scrollButtonChildren || <ChevronDown />}
        </Button>
      )}
    </div>
  );
};

AutoScrollContainerComponent.displayName = "AutoScrollContainer";

export const AutoScrollContainer = memo(AutoScrollContainerComponent);
