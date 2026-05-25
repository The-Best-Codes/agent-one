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

export default function SettingsTarget({ id, children, className }: SettingsTargetProps) {
  const location = useLocation();
  const [phase, setPhase] = useState<"idle" | "active" | "fading">("idle");

  useEffect(() => {
    const timeouts: number[] = [];

    if (location.hash === `#${id}`) {
      timeouts.push(window.setTimeout(() => setPhase("active"), 1000));
      timeouts.push(window.setTimeout(() => setPhase("fading"), HIGHLIGHT_ACTIVE_MS));
      timeouts.push(
        window.setTimeout(() => setPhase("idle"), HIGHLIGHT_ACTIVE_MS + HIGHLIGHT_FADE_MS),
      );
    }

    return () => {
      timeouts.forEach(window.clearTimeout);
    };
  }, [id, location.hash]);

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-4 rounded-md",
        phase === "active" && "settings-target-pulse",
        phase === "fading" && "settings-target-fade-out",
        className,
      )}
    >
      {children}
    </div>
  );
}
