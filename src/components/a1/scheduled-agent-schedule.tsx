import { Cron } from "croner";
import cronstrue from "cronstrue";

import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Kbd } from "@/components/ui/kbd";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value?: string | Date | null) {
  if (!value) return "Unavailable";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : dateTimeFormatter.format(date);
}

export function ScheduledAgentSchedule({ cron, className }: { cron: string; className?: string }) {
  let description = cron;
  let nextRun: Date | null = null;
  let lastRun: Date | null = null;

  try {
    description = cronstrue.toString(cron);
    const schedule = new Cron(cron);
    nextRun = schedule.nextRun();
    lastRun = schedule.previousRuns(1, new Date())[0] ?? null;
  } catch {
    // no-op
  }

  return (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <span className={className} tabIndex={0}>
          {description}
        </span>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent className="flex flex-col items-start gap-1">
        <span>
          Cron: <Kbd>{cron}</Kbd>
        </span>
        <span>Next run: {formatDateTime(nextRun)}</span>
        <span>Last run: {formatDateTime(lastRun)}</span>
      </AdaptiveTooltipContent>
    </AdaptiveTooltip>
  );
}
