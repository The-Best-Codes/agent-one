import {
  AdaptiveTooltip,
  AdaptiveTooltipContent,
  AdaptiveTooltipTrigger,
} from "@/components/ui/adaptive-tooltip";
import { Kbd } from "@/components/ui/kbd";
import { describeSchedule, formatScheduleDateTime } from "@/lib/cron-schedule";

export function ScheduledAgentSchedule({ cron, className }: { cron: string; className?: string }) {
  const scheduleInfo = describeSchedule(cron);

  return (
    <AdaptiveTooltip>
      <AdaptiveTooltipTrigger asChild>
        <span className={className} tabIndex={0}>
          {scheduleInfo.description}
        </span>
      </AdaptiveTooltipTrigger>
      <AdaptiveTooltipContent className="flex flex-col items-start gap-1">
        <span>
          Cron: <Kbd>{cron}</Kbd>
        </span>
        <span>Next run: {formatScheduleDateTime(scheduleInfo.nextRun)}</span>
        <span>Last run: {formatScheduleDateTime(scheduleInfo.lastRun)}</span>
      </AdaptiveTooltipContent>
    </AdaptiveTooltip>
  );
}
