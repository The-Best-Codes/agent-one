import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface VirtualizedProviderListProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  label: string;
  searchQuery: string;
}

export function VirtualizedProviderList<T>({
  items,
  getKey,
  renderItem,
  label,
  searchQuery,
}: VirtualizedProviderListProps<T>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    getItemKey: (index) => getKey(items[index]),
    measureElement: (element) => element.getBoundingClientRect().height,
    overscan: 4,
  });

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [searchQuery]);

  return (
    <div
      ref={parentRef}
      className="max-h-96 overflow-x-hidden overflow-y-auto"
      aria-label={label}
      tabIndex={0}
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            className={cn(
              "absolute top-0 left-0 w-full",
              virtualItem.index < items.length - 1 && "border-b",
            )}
            style={{ transform: `translateY(${virtualItem.start}px)` }}
          >
            {renderItem(items[virtualItem.index])}
          </div>
        ))}
      </div>
    </div>
  );
}
