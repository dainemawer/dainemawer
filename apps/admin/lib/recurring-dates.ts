// Recurring invoice dates. A schedule keeps the day of the month it started
// on (its anchor) and lands on that day every interval, falling back to the
// month's last day when the month is shorter: a schedule anchored on the
// 31st issues on 28/29 Feb, 30 Apr and 31 May.

export const INTERVALS = ["monthly", "quarterly", "yearly"] as const;
export type Interval = (typeof INTERVALS)[number];

const MONTHS: Record<Interval, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

export const INTERVAL_LABEL: Record<Interval, string> = {
  monthly: "Monthly",
  quarterly: "Every 3 months",
  yearly: "Yearly",
};

/** The issue date after `from` (an ISO date) for a schedule anchored on `anchorDay`. */
export function nextIssueDate(
  from: string,
  interval: Interval,
  anchorDay: number,
): string {
  const year = Number(from.slice(0, 4));
  const month = Number(from.slice(5, 7)) - 1 + MONTHS[interval];
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(anchorDay, lastDay)))
    .toISOString()
    .slice(0, 10);
}

/** Every issue date from `next` up to and including `today` (catch-up after missed runs), stopping after `endDate`. */
export function dueIssueDates(
  schedule: {
    nextIssueDate: string;
    interval: Interval;
    anchorDay: number;
    endDate: string | null;
  },
  today: string,
): string[] {
  const dates: string[] = [];
  let date = schedule.nextIssueDate;
  while (date <= today && (!schedule.endDate || date <= schedule.endDate)) {
    dates.push(date);
    date = nextIssueDate(date, schedule.interval, schedule.anchorDay);
  }
  return dates;
}

export type RecurringStatus = "active" | "paused" | "ended";

export function recurringStatus(schedule: {
  pausedAt: Date | null;
  endDate: string | null;
  nextIssueDate: string;
}): RecurringStatus {
  if (schedule.pausedAt) return "paused";
  if (schedule.endDate && schedule.nextIssueDate > schedule.endDate) {
    return "ended";
  }
  return "active";
}
