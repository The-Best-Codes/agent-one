import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  googleGenerativeAiApiKeyAtom,
  groqApiKeyAtom,
  openrouterApiKeyAtom,
  userNameAtom,
} from "@/lib/jotai/settings-atoms";
import { cn } from "@/lib/utils";

function easeInOutExpo(t: number): number {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

const CURSOR_MORPH_DURATION = 500;

type OnboardingStep = "splash" | "name" | "api-keys";

interface ApiKeyInput {
  provider: string;
  key: string;
  label: string;
}

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [isMorphing, setIsMorphing] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("splash");
  const [, setUserName] = useAtom(userNameAtom);
  const [googleKey, setGoogleKey] = useAtom(googleGenerativeAiApiKeyAtom);
  const [groqKey, setGroqKey] = useAtom(groqApiKeyAtom);
  const [openrouterKey, setOpenrouterKey] = useAtom(openrouterApiKeyAtom);

  const [nameInput, setNameInput] = useState("");
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({
    google: googleKey,
    groq: groqKey,
    openrouter: openrouterKey,
  });

  const CONFIG = {
    appName: "AgentOne",
    revealDelay: 600,
    revealDuration: 2000,
    pauseDuration: 1000,
    hideDuration: 2000,
    cursorToButtonDelay: 800,
  };

  const apiKeyConfig: ApiKeyInput[] = [
    {
      provider: "google",
      key: "GOOGLE_GENERATIVE_AI_API_KEY",
      label: "Google Generative AI",
    },
    { provider: "groq", key: "GROQ_API_KEY", label: "Groq" },
    { provider: "openrouter", key: "OPENROUTER_API_KEY", label: "OpenRouter" },
  ];

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
    if (currentStep !== "splash") return;

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
  }, [
    currentStep,
    CONFIG.pauseDuration,
    CONFIG.hideDuration,
    CONFIG.revealDelay,
    CONFIG.revealDuration,
    CONFIG.cursorToButtonDelay,
    animateWidth,
  ]);

  useEffect(() => {
    if (currentStep === "name") {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const handleGetStarted = () => {
    setCurrentStep("name");
  };

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setCurrentStep("api-keys");
    }
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeyInputs((prev) => ({
      ...prev,
      [provider]: value,
    }));
  };

  const handleApiKeysComplete = () => {
    if (apiKeyInputs.google) setGoogleKey(apiKeyInputs.google);
    if (apiKeyInputs.groq) setGroqKey(apiKeyInputs.groq);
    if (apiKeyInputs.openrouter) setOpenrouterKey(apiKeyInputs.openrouter);

    navigate("/chat");
  };

  const hasAtLeastOneKey =
    apiKeyInputs.google || apiKeyInputs.groq || apiKeyInputs.openrouter;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
      {currentStep === "splash" && (
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

          {showButton ? (
            <Button variant="default" size="lg" onClick={handleGetStarted}>
              Get Started
            </Button>
          ) : (
            <div
              className={cn(
                "h-20 w-[3px] bg-white",
                isMorphing ? "animate-cursor-morph" : "animate-blink",
              )}
            />
          )}
        </div>
      )}

      {currentStep === "name" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md px-4 duration-500">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">
                What should I call you?
              </h2>
              <p className="text-muted-foreground">
                Enter your name to personalize your experience.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                ref={nameInputRef}
                type="text"
                placeholder="Your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNameSubmit();
                  }
                }}
              />
              <Button
                onClick={handleNameSubmit}
                disabled={!nameInput.trim()}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {currentStep === "api-keys" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md px-4 duration-500">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white">
                Set up your API keys
              </h2>
              <p className="text-muted-foreground">
                Add at least one API key to get started. You can add more later
                in settings.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {apiKeyConfig.map((config) => (
                <div key={config.provider} className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-white">
                    {config.label}
                  </label>
                  <Input
                    type="password"
                    placeholder={`Paste your ${config.label} API key`}
                    value={apiKeyInputs[config.provider] || ""}
                    onChange={(e) =>
                      handleApiKeyChange(config.provider, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={handleApiKeysComplete}
              disabled={!hasAtLeastOneKey}
              className="w-full"
            >
              Complete Setup
            </Button>
          </div>
        </div>
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
