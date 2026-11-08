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

    let hovered = false;
    let focused = false;
    let active = false;

    const update = () => {
      const nextActive = hovered || focused;
      if (nextActive === active) return;
      active = nextActive;
      if (active) start();
      else reset();
    };
    const onPointerEnter = () => {
      hovered = true;
      update();
    };
    const onPointerLeave = () => {
      hovered = false;
      update();
    };
    const onFocusIn = () => {
      focused = true;
      update();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (trigger.contains(event.relatedTarget as Node | null)) return;
      focused = false;
      update();
    };

    trigger.addEventListener("pointerenter", onPointerEnter);
    trigger.addEventListener("pointerleave", onPointerLeave);
    trigger.addEventListener("focusin", onFocusIn);
    trigger.addEventListener("focusout", onFocusOut);

    return () => {
      cancel();
      trigger.removeEventListener("pointerenter", onPointerEnter);
      trigger.removeEventListener("pointerleave", onPointerLeave);
      trigger.removeEventListener("focusin", onFocusIn);
      trigger.removeEventListener("focusout", onFocusOut);
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
