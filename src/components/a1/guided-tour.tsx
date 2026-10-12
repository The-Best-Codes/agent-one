import { useAtom } from "jotai";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { tourActiveAtom } from "@/lib/jotai/atoms";

interface TourStep {
  target?: string;
  side?: "top" | "right" | "bottom" | "left";
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to AgentOne",
    description: "Let's take a quick look around so you know where everything is.",
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
    description: "That's everything you need to get started. Have fun!",
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

  const handleNext = () => {
    if (isLastStep) {
      onFinish();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const anchorStyle = rect
    ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
    : { top: "40%", left: "50%", width: 0, height: 0 };

  return (
    <>
      <div className="fixed inset-0 z-50" aria-hidden="true">
        <div
          className="fixed rounded-lg shadow-[0_0_0_9999px_rgb(0_0_0/0.5)] transition-all duration-300 motion-reduce:transition-none"
          style={anchorStyle}
        />
      </div>
      <Popover open>
        <PopoverAnchor asChild>
          <div className="pointer-events-none fixed" style={anchorStyle} />
        </PopoverAnchor>
        <PopoverContent
          key={stepIndex}
          side={rect ? step.side : "bottom"}
          sideOffset={12}
          aria-label={step.title}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={onFinish}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <PopoverHeader>
            <PopoverTitle>{step.title}</PopoverTitle>
            <PopoverDescription>{step.description}</PopoverDescription>
          </PopoverHeader>
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
                <Button variant="outline" size="sm" onClick={() => setStepIndex(stepIndex - 1)}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
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
