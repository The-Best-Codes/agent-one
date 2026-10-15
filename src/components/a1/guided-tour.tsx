import { IconX } from "@tabler/icons-react";
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
  targets?: string[];
  side?: "top" | "right" | "bottom" | "left";
  title: string;
  description: string;
  list?: ReactNode[];
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to AgentOne",
    description:
      "AgentOne is an AI agent. Tell it what you need in plain language, and it can answer questions, research topics, and get tasks done for you. This quick tour shows you where everything is.",
  },
  {
    targets: ["chat-input"],
    side: "top",
    title: "The message box",
    description:
      "After the tour, this is where you'll talk to your agent. Write what you need the way you'd ask a person, like \"Help me plan a 3-day trip to Chicago,\" and press Enter to send it. You can keep replying to refine the answer.",
  },
  {
    targets: ["attach"],
    side: "top",
    title: "Attaching files",
    description:
      "Want your agent to look at something? This button attaches images, PDFs, documents, and other files to your message. You can also drag files onto the message box.",
  },
  {
    targets: ["model-selector"],
    side: "top",
    title: "Choosing a model",
    description:
      "Your agent is powered by an AI model, and you can choose which one. Some are faster, some are smarter, and some are better at certain tasks. The button next to it has extra options for the current chat, like whether your agent asks before using tools.",
  },
  {
    targets: ["chat-list", "sidebar-toggle"],
    side: "right",
    title: "Your chats",
    description:
      "Each chat is a separate conversation. Within a chat, your agent remembers what you've talked about, so start a new chat whenever you move on to a different topic or task. Your past chats are saved in the sidebar, so you can search them or pick up where you left off.",
  },
  {
    targets: ["account-menu", "sidebar-toggle"],
    side: "right",
    title: "Extensions, settings, and more",
    description: "Click your account at the bottom of the sidebar to find:",
    list: [
      "Extensions, which connect your agent to other apps and give it new abilities.",
      'Scheduled Agents, which do tasks for you automatically, like "every morning."',
      "Settings, where you can change how AgentOne looks and works.",
    ],
  },
  {
    title: "You're ready!",
    description: "A few tips to get the most out of AgentOne:",
    list: [
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

const measureTargets = (targets: string[] | undefined): Rect | null => {
  for (const target of targets ?? []) {
    const rect = document.querySelector(`[data-tour="${target}"]`)?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      return {
        top: rect.top - SPOTLIGHT_PADDING,
        left: rect.left - SPOTLIGHT_PADDING,
        width: rect.width + SPOTLIGHT_PADDING * 2,
        height: rect.height + SPOTLIGHT_PADDING * 2,
      };
    }
  }
  return null;
};

const isSameRect = (a: Rect | null, b: Rect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height);

const GuidedTourContent = ({ onFinish }: { onFinish: () => void }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [measured, setMeasured] = useState<{ stepIndex: number; rect: Rect | null } | null>(null);
  const maskId = useId();
  const step = TOUR_STEPS[stepIndex]!;
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;
  const rect = measured?.stepIndex === stepIndex ? measured.rect : null;

  useLayoutEffect(() => {
    let frame = requestAnimationFrame(function track() {
      const next = measureTargets(step.targets);
      setMeasured((current) =>
        current?.stepIndex === stepIndex && isSameRect(current.rect, next)
          ? current
          : { stepIndex, rect: next },
      );
      frame = requestAnimationFrame(track);
    });
    return () => cancelAnimationFrame(frame);
  }, [stepIndex, step.targets]);

  const goToStep = (index: number) => {
    setMeasured({ stepIndex: index, rect: measureTargets(TOUR_STEPS[index]!.targets) });
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
            key={stepIndex}
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
          updatePositionStrategy="always"
          className={cn(!rect && "-translate-y-1/2")}
          aria-label={step.title}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={onFinish}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-2">
            <PopoverHeader>
              <PopoverTitle>{step.title}</PopoverTitle>
              <PopoverDescription>{step.description}</PopoverDescription>
            </PopoverHeader>
            <Button variant="ghost" size="icon-xs" aria-label="Close tour" onClick={onFinish}>
              <IconX />
            </Button>
          </div>
          {step.list && (
            <div className="prose prose-sm prose-neutral dark:prose-invert prose-ul:my-0">
              <ul>
                {step.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              {`${stepIndex + 1} of ${TOUR_STEPS.length}`}
            </span>
            <div className="flex items-center gap-2">
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
