import { atom, useAtomValue } from "jotai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { SETTINGS_TOC, type SettingsTocItem } from "./settings-schema";

const BASE = 8;

function getItemOffset(depth: number) {
  if (depth <= 2) return 12 + BASE;
  if (depth === 3) return 24 + BASE;
  return 36 + BASE;
}

function getLineOffset(depth: number) {
  if (depth <= 2) return BASE;
  if (depth === 3) return 12 + BASE;
  return 24 + BASE;
}

const visibleTocItemsAtom = atom((get) =>
  SETTINGS_TOC.filter((item) => !item.visible || get(item.visible)),
);

interface Track {
  width: number;
  height: number;
  d: string;
  positions: [top: number, bottom: number][];
}

interface SettingsNavProps {
  activeIds: string[];
  onNavigate: (id: string) => void;
  className?: string;
}

export default function SettingsNav({ activeIds, onNavigate, className }: SettingsNavProps) {
  const items = useAtomValue(visibleTocItemsAtom);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [track, setTrack] = useState<Track | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      if (container.clientHeight === 0) return;

      const elements = container.querySelectorAll<HTMLElement>("[data-toc-id]");
      const positions: Track["positions"] = [];
      let width = 0;
      let height = 0;
      let d = "";
      let previous: [bottom: number, x: number] | null = null;

      elements.forEach((element, index) => {
        const styles = getComputedStyle(element);
        const x = getLineOffset(items[index].depth) + 0.5;
        const top = element.offsetTop + parseFloat(styles.paddingTop);
        const bottom = element.offsetTop + element.clientHeight - parseFloat(styles.paddingBottom);

        width = Math.max(width, x + 8);
        height = Math.max(height, bottom);
        d += previous
          ? ` L${previous[1]} ${previous[0]} ${x} ${top} L${x} ${bottom}`
          : `M${x} ${top} L${x} ${bottom}`;
        previous = [bottom, x];
        positions.push([top, bottom]);
      });

      setTrack({ width, height, d, positions });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    measure();
    return () => observer.disconnect();
  }, [items]);

  const startIndex = items.findIndex((item) => activeIds.includes(item.id));
  const endIndex =
    startIndex + items.slice(startIndex).filter((item) => activeIds.includes(item.id)).length - 1;
  const hasActive = Boolean(track) && startIndex !== -1;
  const trackTop = hasActive ? (track?.positions[startIndex]?.[0] ?? 0) : 0;
  const trackBottom = hasActive ? (track?.positions[endIndex]?.[1] ?? 0) : 0;

  useEffect(() => {
    const viewport = viewportRef.current;
    const container = containerRef.current;
    if (!viewport || !container || !hasActive) return;

    const top = container.offsetTop + trackTop;
    const bottom = container.offsetTop + trackBottom;
    const margin = 32;
    if (
      top >= viewport.scrollTop + margin &&
      bottom <= viewport.scrollTop + viewport.clientHeight - margin
    ) {
      return;
    }

    viewport.scrollTo({
      top:
        bottom - top > viewport.clientHeight - margin * 2
          ? top - margin
          : (top + bottom) / 2 - viewport.clientHeight / 2,
      behavior: "smooth",
    });
  }, [hasActive, trackTop, trackBottom]);

  return (
    <div
      ref={viewportRef}
      className={cn(
        "relative min-h-0 overflow-x-clip overflow-y-auto overscroll-contain py-3 [scrollbar-width:none] mask-[linear-gradient(to_bottom,transparent,white_16px,white_calc(100%-16px),transparent)]",
        className,
      )}
    >
      <nav
        ref={containerRef}
        aria-label="Settings sections"
        className="relative isolate flex flex-col"
      >
        {track && (
          <svg
            aria-hidden
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${track.width} ${track.height}`}
            className="pointer-events-none absolute start-0 top-0 transition-[clip-path] duration-200"
            style={{
              width: track.width,
              height: track.height,
              clipPath: `polygon(0 ${trackTop}px, 100% ${trackTop}px, 100% ${trackBottom}px, 0 ${trackBottom}px)`,
            }}
          >
            <path d={track.d} className="stroke-primary" strokeWidth="1" fill="none" />
          </svg>
        )}
        {items.map((item, index) => (
          <SettingsNavItem
            key={item.id}
            item={item}
            previous={items[index - 1]}
            next={items[index + 1]}
            active={activeIds.includes(item.id)}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>
    </div>
  );
}

interface SettingsNavItemProps {
  item: SettingsTocItem;
  previous?: SettingsTocItem;
  next?: SettingsTocItem;
  active: boolean;
  onClick: () => void;
}

function SettingsNavItem({ item, previous, next, active, onClick }: SettingsNavItemProps) {
  const l1 = getLineOffset(item.depth);
  const l0 = previous ? getLineOffset(previous.depth) : l1;
  const l2 = next ? getLineOffset(next.depth) : l1;

  return (
    <button
      type="button"
      data-toc-id={item.id}
      data-active={active}
      aria-current={active ? "true" : undefined}
      onClick={onClick}
      className="text-muted-foreground hover:text-accent-foreground focus-visible:text-accent-foreground data-[active=true]:text-primary relative py-1.5 text-start text-sm wrap-anywhere transition-colors outline-none first:pt-0 last:pb-0"
      style={{ paddingInlineStart: getItemOffset(item.depth) }}
    >
      <svg
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "absolute start-0 -top-1.5 bottom-0 -z-1 h-[calc(100%+--spacing(1.5))]",
          l1 !== l2 && "bottom-1.5 h-full",
        )}
        style={{ width: Math.max(l0, l1) + 9 }}
      >
        {l0 !== l1 && (
          <path
            d={`M ${l0 + 0.5} 0 L ${l0 + 0.5} 0 ${l1 + 0.5} 12`}
            strokeWidth="1"
            fill="none"
            className="stroke-foreground/10"
          />
        )}
        <line
          x1={l1 + 0.5}
          y1={l0 === l1 ? "6" : "12"}
          x2={l1 + 0.5}
          y2="100%"
          strokeWidth="1"
          className="stroke-foreground/10"
        />
      </svg>
      {item.title}
    </button>
  );
}
