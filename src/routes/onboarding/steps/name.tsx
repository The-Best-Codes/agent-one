import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NameStepProps {
  onSubmit: (name: string) => void;
}

export function NameStep({ onSubmit }: NameStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (nameInput.trim()) {
      onSubmit(nameInput.trim());
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-5 fade-in-0 w-full max-w-md px-4 duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-2xl font-bold">
            What should I call you?
          </h2>
          <p className="text-muted-foreground">
            Enter your name to personalize your experience.
          </p>
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
          <Button
            onClick={handleSubmit}
            disabled={!nameInput.trim()}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
