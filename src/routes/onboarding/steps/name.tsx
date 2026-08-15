import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NameStepProps {
  onSubmit: (name: string) => void;
}

type Phase = "input" | "input-fading-out" | "greeting" | "greeting-fading-out";

export function NameStep({ onSubmit }: NameStepProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState("");
  const [phase, setPhase] = useState<Phase>("input");

  useEffect(() => {
    if (phase === "input") {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "input-fading-out") {
      const timer = setTimeout(() => {
        setPhase("greeting");
      }, 500);
      return () => clearTimeout(timer);
    }

    if (phase === "greeting") {
      const timer = setTimeout(() => {
        setPhase("greeting-fading-out");
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (phase === "greeting-fading-out") {
      const timer = setTimeout(() => {
        onSubmit(nameInput.trim());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, nameInput, onSubmit]);

  const handleSubmit = () => {
    if (nameInput.trim()) {
      setPhase("input-fading-out");
    }
  };

  if (phase === "greeting" || phase === "greeting-fading-out") {
    return (
      <div
        className={cn(
          "flex w-full max-w-md items-center justify-center px-4",
          phase === "greeting"
            ? "animate-in slide-in-from-bottom-5 fade-in-0 duration-500"
            : "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards duration-500",
        )}
      >
        <h2 className="text-foreground text-4xl font-bold">
          {t("onboarding.hiName", { name: nameInput.trim() })}
        </h2>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full max-w-md px-4",
        phase === "input"
          ? "animate-in slide-in-from-bottom-5 fade-in-0 duration-500"
          : "animate-out slide-out-to-top-5 fade-out-0 fill-mode-forwards duration-500",
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-2xl font-bold">{t("onboarding.whatShouldICallYou")}</h2>
          <p className="text-muted-foreground">{t("onboarding.enterNamePersonalize")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Input
            ref={inputRef}
            type="text"
            placeholder={t("onboarding.namePlaceholder")}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
          />
          <Button onClick={handleSubmit} disabled={!nameInput.trim()} className="w-full">
            {t("common.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
