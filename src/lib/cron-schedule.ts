import { Cron } from "croner";
import cronstrue from "cronstrue";

export interface CronScheduleInfo {
  description: string;
  nextRun: string | null;
  nextRunHuman: string;
  lastRun: string | null;
  lastRunHuman: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatScheduleDateTime(value?: string | Date | null): string {
  if (!value) return "Unavailable";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : dateTimeFormatter.format(date);
}

export function describeSchedule(schedule: string, now = new Date()): CronScheduleInfo {
  try {
    const description = cronstrue.toString(schedule, { verbose: true });
    const cron = new Cron(schedule);
    const nextRun = cron.nextRun(now);
    const lastRun = cron.previousRuns(1, now)[0] ?? null;
    return {
      description,
      nextRun: nextRun?.toISOString() ?? null,
      nextRunHuman: formatScheduleDateTime(nextRun),
      lastRun: lastRun?.toISOString() ?? null,
      lastRunHuman: formatScheduleDateTime(lastRun),
    };
  } catch {
    return {
      description: schedule,
      nextRun: null,
      nextRunHuman: "Unavailable",
      lastRun: null,
      lastRunHuman: "Unavailable",
    };
  }
}
