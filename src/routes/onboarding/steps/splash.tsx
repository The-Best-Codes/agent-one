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
  revealDelay: 500,
  revealDuration: 1000,
  pauseDuration: 1000,
  hideDuration: 1000,
  cursorToButtonDelay: 100,
  welcomeDelay: 0,
};

interface SplashStepProps {
  onGetStarted: () => void;
}

export function SplashStep({ onGetStarted }: SplashStepProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isMorphing, setIsMorphing] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

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

  const handleGetStarted = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onGetStarted();
    }, 500);
  };

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

                    const welcomeTimeout = window.setTimeout(() => {
                      setShowWelcome(true);
                    }, CONFIG.welcomeDelay);

                    timeouts.push(welcomeTimeout);
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
    <div
      className={cn(
        "flex flex-col items-center",
        isExiting && "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards duration-500",
      )}
    >
      <div
        className={cn(
          "grid transition-all duration-1000 ease-in-out",
          showWelcome ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        style={{ gridTemplateRows: showWelcome ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col items-center gap-2 pb-4 text-center">
            <h1 className="text-foreground text-4xl font-bold">Welcome to {CONFIG.appName}</h1>
            <p className="text-muted-foreground text-xl">
              Let's get you set up with a few questions
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          ref={containerRef}
          className="overflow-hidden py-2 text-right whitespace-nowrap"
          style={{ width: 0 }}
        >
          <span ref={textRef} className="text-foreground text-5xl">
            {CONFIG.appName}
          </span>
        </div>

        {showButton ? (
          <Button variant="default" size="lg" onClick={handleGetStarted}>
            Get Started
          </Button>
        ) : (
          <div
            className={cn(
              "bg-foreground h-12 w-0.75",
              isMorphing ? "animate-cursor-morph" : "animate-blink",
            )}
          />
        )}
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

        @keyframes cursor-morph {
          0% {
            width: 3px;
            height: 48px;
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
