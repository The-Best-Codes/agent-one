"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef, type ReactNode, useImperativeHandle } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

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

const ScrollDownButton = ({
  behavior,
  scrollButtonClassName,
  scrollButtonChildren,
  scrollButtonProps,
}: Pick<
  AutoScrollContainerProps,
  | "behavior"
  | "scrollButtonClassName"
  | "scrollButtonChildren"
  | "scrollButtonProps"
>) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) {
    return null;
  }

  const handleClick = () => {
    scrollToBottom({ animation: behavior });
  };

  return (
    <Button
      size="icon"
      onClick={handleClick}
      className={cn(
        "absolute bottom-4 right-4 z-10 hover:opacity-75",
        scrollButtonClassName,
      )}
      variant="default"
      aria-label="Scroll to bottom"
      {...scrollButtonProps}
    >
      {scrollButtonChildren || <ChevronDown />}
    </Button>
  );
};

export type AutoScrollHandle = {
  scrollToBottom: () => void;
};

function ImperativeHandle({
  forwardedRef,
  behavior,
}: {
  forwardedRef: React.Ref<AutoScrollHandle> | undefined;
  behavior: AutoScrollContainerProps["behavior"];
}) {
  const { scrollToBottom } = useStickToBottomContext();

  useImperativeHandle(
    forwardedRef,
    () => ({
      scrollToBottom: () => scrollToBottom({ animation: behavior }),
    }),
    [scrollToBottom, behavior],
  );

  return null;
}

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
      behavior,
      ...props
    },
    ref,
  ) => {
    return (
      <StickToBottom
        className={cn("relative h-full w-full overflow-y-auto", className)}
        resize={behavior}
        initial={behavior}
        {...props}
      >
        <StickToBottom.Content className={scrollableClassName}>
          {children}
        </StickToBottom.Content>

        <ScrollDownButton
          behavior={behavior}
          scrollButtonClassName={scrollButtonClassName}
          scrollButtonChildren={scrollButtonChildren}
          scrollButtonProps={scrollButtonProps}
        />

        <ImperativeHandle forwardedRef={ref} behavior={behavior} />
      </StickToBottom>
    );
  },
);

AutoScrollContainer.displayName = "AutoScrollContainer";
