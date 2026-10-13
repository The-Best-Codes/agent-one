import { IconBook, IconExternalLink, IconMap } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AGENT_ONE_DOCS_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface WelcomeStepProps {
  name: string;
  onComplete: () => void;
  onStartTour: () => void;
}

export function WelcomeStep({ name, onComplete, onStartTour }: WelcomeStepProps) {
  const [isExiting, setIsExiting] = useState(false);

  const exitThen = (callback: () => void) => {
    setIsExiting(true);
    setTimeout(callback, 500);
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center justify-center gap-8 px-4 duration-500",
        isExiting
          ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards"
          : "animate-in slide-in-from-bottom-5 fade-in-0",
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-foreground text-4xl font-bold">You're all set!</h1>
        <p className="text-muted-foreground text-lg">{`Welcome aboard, ${name}. Ready to get started?`}</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button
          size="lg"
          className="h-14 justify-start px-6 text-lg"
          onClick={() => exitThen(onStartTour)}
          disabled={isExiting}
        >
          <IconMap data-icon="inline-start" />
          Take the Tour
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14 justify-between px-6 text-lg">
          <a href={AGENT_ONE_DOCS_URL} target="_blank" rel="noreferrer">
            <div className="flex items-center gap-2">
              <IconBook data-icon="inline-start" />
              Browse Documentation
            </div>
            <IconExternalLink className="size-5" />
          </a>
        </Button>
        <Button variant="link" onClick={() => exitThen(onComplete)} disabled={isExiting}>
          Skip and launch AgentOne
        </Button>
      </div>
    </div>
  );
}
