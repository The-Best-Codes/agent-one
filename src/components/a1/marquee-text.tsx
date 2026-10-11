import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

const SCROLL_SPEED_EM_PER_SECOND = 2;
const START_DELAY_MS = 350;
const MIN_DURATION_MS = 400;

const easeInOutSine = (progress: number) => -(Math.cos(Math.PI * progress) - 1) / 2;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const MarqueeText = ({
  className,
  contentClassName,
  children,
  ...props
}: ComponentProps<"span"> & { contentClassName?: string }) => {
  const viewportRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = viewport?.firstElementChild;
    if (!viewport || !content) return;

    const measure = () => setIsOverflowing(viewport.scrollWidth - viewport.clientWidth >= 1);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    resizeObserver.observe(content, { box: "border-box" });
    measure();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const trigger = viewport.closest<HTMLElement>("[data-marquee-trigger]") ?? viewport;
    let frame = 0;
    let delay = 0;

    const cancel = () => {
      window.clearTimeout(delay);
      cancelAnimationFrame(frame);
    };

    const start = () => {
      cancel();
      const distance = viewport.scrollWidth - viewport.clientWidth;
      if (distance < 1 || prefersReducedMotion()) return;

      const direction = getComputedStyle(viewport).direction === "rtl" ? -1 : 1;
      const fontSize = Number.parseFloat(getComputedStyle(viewport).fontSize) || 14;
      const duration = Math.max(
        (distance / (fontSize * SCROLL_SPEED_EM_PER_SECOND)) * 1000,
        MIN_DURATION_MS,
      );

      delay = window.setTimeout(() => {
        const startedAt = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          viewport.scrollLeft = direction * distance * easeInOutSine(progress);
          if (progress < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      }, START_DELAY_MS);
    };

    const reset = () => {
      cancel();
      viewport.scrollTo({ left: 0, behavior: prefersReducedMotion() ? "instant" : "smooth" });
    };

    trigger.addEventListener("pointerenter", start);
    trigger.addEventListener("pointerleave", reset);
    trigger.addEventListener("focusin", start);
    trigger.addEventListener("focusout", reset);

    return () => {
      cancel();
      trigger.removeEventListener("pointerenter", start);
      trigger.removeEventListener("pointerleave", reset);
      trigger.removeEventListener("focusin", start);
      trigger.removeEventListener("focusout", reset);
    };
  }, []);

  return (
    <span
      ref={viewportRef}
      className={cn(
        "block min-w-0 overflow-hidden whitespace-nowrap [--scroll-fade-reveal:--spacing(4)] [--scroll-fade-size:--spacing(5)]",
        isOverflowing && "scroll-fade-x",
        className,
      )}
      {...props}
    >
      <span className={cn("inline-block", contentClassName)}>{children}</span>
    </span>
  );
};
