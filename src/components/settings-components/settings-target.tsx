import { type ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router";

import { cn } from "@/lib/utils";

const HIGHLIGHT_ACTIVE_MS = 4000;
const HIGHLIGHT_FADE_MS = 1000;

interface SettingsTargetProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SettingsTarget({ id, children, className }: SettingsTargetProps) {
  const location = useLocation();
  const [phase, setPhase] = useState<"idle" | "active" | "fading">("idle");

  useEffect(() => {
    if (location.hash !== `#${id}`) return;

    const timeouts = [
      window.setTimeout(() => setPhase("active"), 1000),
      window.setTimeout(() => setPhase("fading"), HIGHLIGHT_ACTIVE_MS),
      window.setTimeout(() => setPhase("idle"), HIGHLIGHT_ACTIVE_MS + HIGHLIGHT_FADE_MS),
    ];

    return () => {
      timeouts.forEach(window.clearTimeout);
      setPhase("idle");
    };
  }, [id, location.hash, location.key]);

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-4 rounded-[calc(var(--radius-xl)+4px)] bg-transparent transition-[colors,padding] duration-300",
        phase === "active" && "settings-target-pulse bg-primary/10 p-2",
        phase === "fading" && "settings-target-fade-out bg-primary/10 p-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
