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
}

const AutoScrollContainerComponent = ({
  children,
  className,
  scrollableClassName,
  scrollButtonClassName,
  scrollButtonChildren,
  scrollButtonProps,
  ...props
}: AutoScrollContainerProps) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
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
    contentRef.current.scrollTop = contentRef.current.scrollHeight;
    setUserHasScrolledUp(false);
    setShowScrollButton(false);
    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 100);
  }, []);

  const handleScroll = useCallback(() => {
    if (!contentRef.current || isAutoScrollingRef.current) return;

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
