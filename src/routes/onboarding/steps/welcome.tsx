import { BookOpenIcon, GraduationCapIcon, RocketIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WelcomeStepProps {
  name: string;
  onComplete: () => void;
}

export function WelcomeStep({ name, onComplete }: WelcomeStepProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleLaunch = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 500);
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
        <p className="text-muted-foreground text-lg">
          Welcome aboard, {name}. Ready to get started?
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button
          size="lg"
          className="h-14 justify-start px-6 text-lg"
          onClick={handleLaunch}
          disabled={isExiting}
        >
          <RocketIcon className="size-5" />
          Launch AgentOne
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 justify-start px-6 text-lg"
          disabled
        >
          <GraduationCapIcon className="size-5" />
          Take the Tutorial
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 justify-start px-6 text-lg"
          disabled
        >
          <BookOpenIcon className="size-5" />
          Browse Documentation
        </Button>
      </div>
    </div>
  );
}
