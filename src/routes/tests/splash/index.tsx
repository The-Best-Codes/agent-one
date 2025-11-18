import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

export default function SplashTestRoute() {
  const [cursorFadeOut, setCursorFadeOut] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CONFIG = {
    appName: "AgentOne",
    revealDelay: 600,
    revealDuration: 2000,
  };

  const revealText = useCallback(
    (fullWidth: number) => {
      const startTime = performance.now();

      function frame(now: number) {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / CONFIG.revealDuration, 1);
        const easedT = easeInOutExpo(t);

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
    [CONFIG.revealDuration],
  );

  useEffect(() => {
    const measureWidth = () => {
      if (textRef.current) {
        const width = textRef.current.getBoundingClientRect().width;

        setTimeout(() => {
          revealText(width);
        }, CONFIG.revealDelay);
      }
    };

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
          className={cn("bg-white w-[3px] h-20", cursorFadeOut ? "animate-fade-out" : "animate-blink")}
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
