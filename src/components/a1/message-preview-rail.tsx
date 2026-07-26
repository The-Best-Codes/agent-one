import type { UIMessage } from "ai";
import { useEffect, useState } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const getMessagePreview = (message: UIMessage) => {
  const text = message.parts
    .flatMap((part) => {
      if (part.type === "text" || part.type === "reasoning") return part.text;
      if (part.type === "file") return part.filename ? `File: ${part.filename}` : "File attachment";
      return [];
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return text || "Message with tools or attachments";
};

export function MessagePreviewRail({
  messages,
  onMessageSelect,
  getScrollElement,
}: {
  messages: UIMessage[];
  onMessageSelect: (index: number) => void;
  getScrollElement: () => HTMLElement | null;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [visibleIndexes, setVisibleIndexes] = useState<Set<number>>(new Set());
  const displayedIndex = hoveredIndex ?? focusedIndex;
  const displayedMessage = displayedIndex == null ? undefined : messages[displayedIndex];

  useEffect(() => {
    const root = getScrollElement();
    if (!root) return;

    const observedElements = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIndexes((current) => {
          const next = new Set(current);
          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.messageIndex);
            if (entry.isIntersecting) next.add(index);
            else next.delete(index);
          }
          return next;
        });
      },
      { root },
    );

    const observeMessages = () => {
      const removedIndexes: number[] = [];
      for (const element of observedElements) {
        if (!element.isConnected) {
          removedIndexes.push(Number((element as HTMLElement).dataset.messageIndex));
          observer.unobserve(element);
          observedElements.delete(element);
        }
      }
      if (removedIndexes.length > 0) {
        setVisibleIndexes((current) => {
          const next = new Set(current);
          for (const index of removedIndexes) next.delete(index);
          return next;
        });
      }

      for (const element of root.querySelectorAll("[data-message-index]")) {
        if (observedElements.has(element)) continue;
        observedElements.add(element);
        observer.observe(element);
      }
    };

    observeMessages();
    const mutationObserver = new MutationObserver(observeMessages);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [getScrollElement]);

  return (
    <div className="pointer-events-none fixed top-1/2 right-0 z-20 hidden w-12 -translate-y-1/2 items-center md:flex">
      <nav
        aria-label="Chat message navigation"
        onPointerLeave={() => setHoveredIndex(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusedIndex(null);
        }}
        className="pointer-events-auto relative grid w-12 shrink-0 content-stretch"
        style={{
          height: `min(${messages.length * 20}px, calc(100svh - 2rem))`,
          gridTemplateRows: `repeat(${messages.length}, minmax(0, 1fr))`,
        }}
      >
        {messages.map((message, index) => {
          const distance =
            displayedIndex == null ? Number.POSITIVE_INFINITY : Math.abs(index - displayedIndex);
          const scale =
            visibleIndexes.has(index) || distance === 0
              ? 1
              : distance === 1
                ? 0.68
                : distance === 2
                  ? 0.44
                  : 0.25;

          return (
            <button
              key={message.id}
              type="button"
              aria-label={`Scroll to ${message.role === "user" ? "your" : "assistant"} message ${index + 1}`}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") setHoveredIndex(index);
              }}
              onPointerDown={() => setFocusedIndex(null)}
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible")) setFocusedIndex(index);
              }}
              onClick={() => onMessageSelect(index)}
              className="text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background relative flex min-h-1 w-12 cursor-pointer items-center justify-end focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-0.5 w-12 origin-right bg-current transition-transform duration-300 ease-out motion-reduce:transition-none",
                  displayedIndex === index && "text-foreground",
                )}
                style={{ transform: `scaleX(${scale})` }}
              />
            </button>
          );
        })}

        {displayedMessage && displayedIndex != null ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-16 w-72 -translate-y-1/2"
            style={{ top: `${((displayedIndex + 0.5) / messages.length) * 100}%` }}
          >
            <Card key={displayedMessage.id}>
              <CardHeader>
                <CardTitle>{displayedMessage.role === "user" ? "You" : "AgentOne"}</CardTitle>
                <CardDescription className="line-clamp-4 leading-6">
                  {getMessagePreview(displayedMessage)}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : null}
      </nav>
    </div>
  );
}
