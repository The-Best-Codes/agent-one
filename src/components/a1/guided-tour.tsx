import { useAtom } from "jotai";
import { type ReactNode, useCallback, useEffect, useId, useLayoutEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { AGENT_ONE_DOCS_URL } from "@/lib/constants";
import { tourActiveAtom } from "@/lib/jotai/atoms";
import { cn } from "@/lib/utils";

interface TourStep {
  target?: string;
  side?: "top" | "right" | "bottom" | "left";
  title: string;
  description: string;
  tips?: ReactNode[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to AgentOne",
    description:
      "AgentOne is an AI agent that can answer questions, research topics, and get things done for you. With extensions, it can even work with your other apps. Let's take a quick look around.",
  },
  {
    target: "chat-input",
    side: "top",
    title: "Chat with your agent",
    description:
      "Type a message here and press Enter to send it. Your agent can answer questions, do research, and take actions for you.",
  },
  {
    target: "attach",
    side: "top",
    title: "Add files",
    description:
      "Attach images, documents, and other files to your message. You can also drag and drop them onto the message box.",
  },
  {
    target: "model-selector",
    side: "top",
    title: "Pick a model",
    description:
      "Choose which AI model answers you. The button next to it lets you fine-tune how the model behaves in this chat.",
  },
  {
    target: "chat-list",
    side: "right",
    title: "Your chats",
    description:
      "Every conversation is saved here. Start a new chat, search past ones, or right-click a chat for more options.",
  },
  {
    target: "account-menu",
    side: "right",
    title: "Extensions, settings, and more",
    description:
      "Open this menu to add extensions that give your agent new abilities, set up scheduled agents, and change your settings.",
  },
  {
    title: "You're ready!",
    description: "A few tips to get the most out of AgentOne:",
    tips: [
      'Ask it to remember things, like "Remember that I prefer short answers."',
      'Ask it to do something on a schedule, like "Summarize the news every morning."',
      <>
        Have a question? Check out the{" "}
        <a href={AGENT_ONE_DOCS_URL} target="_blank" rel="noreferrer">
          documentation
        </a>
        .
      </>,
      "You can take this tour again anytime from Settings under Help & Updates.",
    ],
  },
];

const SPOTLIGHT_PADDING = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const getTargetElement = (target: string) => {
  const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 ? element : null;
};

const measure = (element: HTMLElement): Rect => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
};

const GuidedTourContent = ({ onFinish }: { onFinish: () => void }) => {
  const [steps] = useState(() =>
    TOUR_STEPS.filter((step) => !step.target || getTargetElement(step.target)),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [measured, setMeasured] = useState<{ target: string; rect: Rect } | null>(null);
  const maskId = useId();
  const step = steps[stepIndex]!;
  const isLastStep = stepIndex === steps.length - 1;
  const rect = step.target && measured?.target === step.target ? measured.rect : null;

  useLayoutEffect(() => {
    const target = step.target;
    const element = target ? getTargetElement(target) : null;
    if (!target || !element) return;

    const update = () => setMeasured({ target, rect: measure(element) });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);
    window.addEventListener("resize", update);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [step.target]);

  const goToStep = (index: number) => {
    const target = steps[index]!.target;
    const element = target ? getTargetElement(target) : null;
    if (target && element) {
      setMeasured({ target, rect: measure(element) });
    }
    setStepIndex(index);
  };

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
    } else {
      goToStep(stepIndex + 1);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50" aria-hidden="true">
        <svg className="pointer-events-none size-full">
          <defs>
            <mask id={maskId}>
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left}
                  y={rect.top}
                  width={rect.width}
                  height={rect.height}
                  rx={8}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgb(0 0 0 / 0.5)" mask={`url(#${maskId})`} />
        </svg>
        {rect && (
          <div
            key={step.target}
            className="ring-primary animate-in fade-in-0 zoom-in-95 fixed rounded-lg ring-2 duration-100"
            style={rect}
          />
        )}
      </div>
      <Popover open>
        <PopoverAnchor asChild>
          <div
            className="pointer-events-none fixed"
            style={rect ?? { top: "50%", left: "50%", width: 0, height: 0 }}
          />
        </PopoverAnchor>
        <PopoverContent
          key={stepIndex}
          side={rect ? step.side : "bottom"}
          sideOffset={rect ? 12 : 0}
          avoidCollisions={!!rect}
          className={cn(!rect && "-translate-y-1/2")}
          aria-label={step.title}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={onFinish}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <PopoverHeader>
            <PopoverTitle>{step.title}</PopoverTitle>
            <PopoverDescription>{step.description}</PopoverDescription>
          </PopoverHeader>
          {step.tips && (
            <div className="prose prose-sm prose-neutral dark:prose-invert prose-ul:my-0">
              <ul>
                {step.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              {`${stepIndex + 1} of ${steps.length}`}
            </span>
            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button variant="ghost" size="sm" onClick={onFinish}>
                  Skip
                </Button>
              )}
              {stepIndex > 0 && (
                <Button variant="outline" size="sm" onClick={() => goToStep(stepIndex - 1)}>
                  Back
                </Button>
              )}
              <Button size="sm" autoFocus onClick={handleNext}>
                {isLastStep ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

const DelayedGuidedTour = ({ onFinish }: { onFinish: () => void }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return ready ? <GuidedTourContent onFinish={onFinish} /> : null;
};

export const GuidedTour = () => {
  const [tourActive, setTourActive] = useAtom(tourActiveAtom);
  const handleFinish = useCallback(() => setTourActive(false), [setTourActive]);

  return tourActive ? <DelayedGuidedTour onFinish={handleFinish} /> : null;
};
