import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export default function SplashTestRoute() {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CONFIG = {
    appName: "AgentOne",
    revealDelay: 600,
    revealDuration: 2000,
    pauseDuration: 1000, // how long to pause after reveal (ms)
    hideDuration: 2000, // how long the reverse animation takes (ms)
  };

  const animateWidth = useCallback(
    (from: number, to: number, duration: number, onComplete?: () => void) => {
      const startTime = performance.now();

      function frame(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easedT = easeInOutExpo(t);
        const currentWidth = from + (to - from) * easedT;

        if (containerRef.current) {
          containerRef.current.style.width = currentWidth + "px";
        }

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          if (containerRef.current) {
            containerRef.current.style.width = to + "px";
          }
          if (onComplete) {
            onComplete();
          }
        }
      }

      requestAnimationFrame(frame);
    },
    [],
  );

  useEffect(() => {
    const timeouts: number[] = [];

    const measureWidth = () => {
      if (textRef.current) {
        const width = textRef.current.getBoundingClientRect().width;

        const revealTimeout = window.setTimeout(() => {
          // Entrance animation
          animateWidth(0, width, CONFIG.revealDuration, () => {
            // Pause with blinking cursor, no fade-out
            const pauseTimeout = window.setTimeout(() => {
              // Reverse animation (shrink back to only cursor)
              animateWidth(width, 0, CONFIG.hideDuration);
            }, CONFIG.pauseDuration);

            timeouts.push(pauseTimeout);
          });
        }, CONFIG.revealDelay);

        timeouts.push(revealTimeout);
      }
    };

    const initialTimeout = window.setTimeout(measureWidth, 100);
    timeouts.push(initialTimeout);

    return () => {
      timeouts.forEach((id) => clearTimeout(id));
    };
  }, [
    CONFIG.pauseDuration,
    CONFIG.hideDuration,
    CONFIG.revealDelay,
    CONFIG.revealDuration,
    animateWidth,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
      <div className="flex items-center gap-2">
        <div
          ref={containerRef}
          className="overflow-hidden text-right whitespace-nowrap"
          style={{ width: 0 }}
        >
          <span
            ref={textRef}
            className="font-bold text-white"
            style={{
              fontSize: "72px",
              fontFamily:
                "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              letterSpacing: "2px",
            }}
          >
            {CONFIG.appName}
          </span>
        </div>
        <div className={cn("bg-white w-[3px] h-20 animate-blink")} />
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        .animate-blink {
          animation: blink 0.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
