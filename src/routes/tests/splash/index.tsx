import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function SplashTestRoute() {
  const [cursorFadeOut, setCursorFadeOut] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CONFIG = {
    appName: "AgentOne",
    revealDelay: 600,
    revealDuration: 2000,
    easing: "easeInOutCubic" as const,
  };

  const EASING = useMemo(
    () => ({
      linear: (t: number) => t,
      easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
      easeInOutCubic: (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    }),
    [],
  );

  const revealText = useCallback(
    (fullWidth: number) => {
      const startTime = performance.now();
      const easingFn = EASING[CONFIG.easing] || EASING.linear;

      function frame(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / CONFIG.revealDuration, 1);
        const easedT = easingFn(t);

        const currentWidth = fullWidth * easedT;

        if (containerRef.current) {
          containerRef.current.style.width = currentWidth + "px";
        }

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          if (containerRef.current) {
            containerRef.current.style.width = fullWidth + "px";
          }
          setCursorFadeOut(true);
        }
      }

      requestAnimationFrame(frame);
    },
    [CONFIG.easing, CONFIG.revealDuration, EASING],
  );

  useEffect(() => {
    const measureWidth = () => {
      if (textRef.current) {
        const width = textRef.current.getBoundingClientRect().width;

        // Start revealing after delay
        setTimeout(() => {
          revealText(width);
        }, CONFIG.revealDelay);
      }
    };

    // Measure after a brief delay to ensure font is loaded
    const timer = setTimeout(measureWidth, 100);
    return () => clearTimeout(timer);
  }, [CONFIG.revealDelay, revealText]);

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
        <div
          className={`bg-white ${cursorFadeOut ? "animate-fade-out" : "animate-blink"}`}
          style={{
            width: "3px",
            height: "80px",
          }}
        />
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

        @keyframes fade-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-blink {
          animation: blink 0.5s ease-in-out infinite;
        }

        .animate-fade-out {
          animation: fade-out 0.25s forwards;
        }
      `}</style>
    </div>
  );
}
