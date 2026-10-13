import { IconArrowRight } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NameStepProps {
  onSubmit: (name: string) => void;
}

export function NameStep({ onSubmit }: NameStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isExiting) return;
    const timer = setTimeout(() => {
      onSubmit(nameInput.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [isExiting, nameInput, onSubmit]);

  const handleSubmit = () => {
    if (nameInput.trim()) {
      setIsExiting(true);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-md px-4",
        isExiting
          ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards duration-500"
          : "animate-in slide-in-from-bottom-5 fade-in-0 duration-500",
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-2xl font-bold">What should I call you?</h2>
          <p className="text-muted-foreground">Enter your name to personalize your experience.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />

          <Button onClick={handleSubmit} disabled={!nameInput.trim()} className="w-full">
            Continue
            <IconArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface GreetingStepProps {
  name: string;
  onComplete: () => void;
}

export function GreetingStep({ name, onComplete }: GreetingStepProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = isExiting
      ? setTimeout(onComplete, 500)
      : setTimeout(() => setIsExiting(true), 1500);
    return () => clearTimeout(timer);
  }, [isExiting, onComplete]);

  return (
    <div
      className={cn(
        "flex w-full max-w-md items-center justify-center px-4",
        isExiting
          ? "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards duration-500"
          : "animate-in slide-in-from-bottom-5 fade-in-0 duration-500",
      )}
    >
      <h2 className="text-foreground text-4xl font-bold">{`Hi, ${name}!`}</h2>
    </div>
  );
}
