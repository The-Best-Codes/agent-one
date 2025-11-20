import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

const CURSOR_MORPH_DURATION = 500;

const CONFIG = {
  appName: "AgentOne",
  revealDelay: 600,
  revealDuration: 2000,
  pauseDuration: 1000,
  hideDuration: 2000,
  cursorToButtonDelay: 800,
};

interface SplashStepProps {
  onGetStarted: () => void;
}

export function SplashStep({ onGetStarted }: SplashStepProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMorphing, setIsMorphing] = useState(false);
  const [showButton, setShowButton] = useState(false);

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
          animateWidth(0, width, CONFIG.revealDuration, () => {
            const pauseTimeout = window.setTimeout(() => {
              animateWidth(width, 0, CONFIG.hideDuration, () => {
                const toButtonDelayTimeout = window.setTimeout(() => {
                  setIsMorphing(true);

                  const morphTimeout = window.setTimeout(() => {
                    setShowButton(true);
                    setIsMorphing(false);
                  }, CURSOR_MORPH_DURATION);

                  timeouts.push(morphTimeout);
                }, CONFIG.cursorToButtonDelay);

                timeouts.push(toButtonDelayTimeout);
              });
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
      timeouts.forEach((id) => window.clearTimeout(id));
    };
  }, [animateWidth]);

  return (
    <div className="flex items-center gap-2">
      <div
        ref={containerRef}
        className="overflow-hidden text-right whitespace-nowrap"
        style={{ width: 0 }}
      >
        <span
          ref={textRef}
          className="text-foreground font-bold"
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

      {showButton ? (
        <Button variant="default" size="lg" onClick={onGetStarted}>
          Get Started
        </Button>
      ) : (
        <div
          className={cn(
            "bg-foreground h-20 w-[3px]",
            isMorphing ? "animate-cursor-morph" : "animate-blink",
          )}
        />
      )}

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

        @keyframes cursor-morph {
          0% {
            width: 3px;
            height: 80px;
            border-radius: 8px;
          }
          40% {
            width: 3px;
            height: 40px;
            border-radius: 8px;
          }
          100% {
            width: 124px;
            height: 40px;
            border-radius: 8px;
          }
        }

        .animate-cursor-morph {
          animation: cursor-morph ${CURSOR_MORPH_DURATION}ms ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
