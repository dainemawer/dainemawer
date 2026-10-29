// The HUD's Linear tile: your assigned issues (lib/linear.ts fetches them)
// sorted into what needs you today. Pure, so the tests can import it.

export type LinearIssue = {
  identifier: string;
  title: string;
  url: string;
  /** 0 none, 1 urgent, 2 high, 3 medium, 4 low. */
  priority: number;
  dueDate: string | null;
  completedAt: string | null;
  state: {
    type:
      | "triage"
      | "backlog"
      | "unstarted"
      | "started"
      | "completed"
      | "canceled";
  };
  project: { name: string } | null;
};

export type TodayReason = "overdue" | "due" | "started" | "urgent" | "high";

export type TodayItem = {
  identifier: string;
  title: string;
  url: string;
  project: string | null;
  reason: TodayReason;
  dueDate: string | null;
};

export type LinearToday = {
  inProgress: number;
  overdue: number;
  dueToday: number;
  doneToday: number;
  /** Most pressing first: late, due today, in progress, then urgent and high to-dos. */
  items: TodayItem[];
};

const RANK: Record<TodayReason, number> = {
  overdue: 0,
  due: 1,
  started: 2,
  urgent: 3,
  high: 4,
};

export function linearToday(issues: LinearIssue[], today: string): LinearToday {
  const open = issues.filter(
    (i) => i.state.type !== "completed" && i.state.type !== "canceled",
  );
  const reasonFor = (i: LinearIssue): TodayReason | null => {
    if (i.dueDate && i.dueDate < today) return "overdue";
    if (i.dueDate === today) return "due";
    if (i.state.type === "started") return "started";
    if (i.state.type === "unstarted" && i.priority === 1) return "urgent";
    if (i.state.type === "unstarted" && i.priority === 2) return "high";
    return null;
  };
  const items = open
    .flatMap((i): TodayItem[] => {
      const reason = reasonFor(i);
      return reason
        ? [
            {
              identifier: i.identifier,
              title: i.title,
              url: i.url,
              project: i.project?.name ?? null,
              reason,
              dueDate: i.dueDate,
            },
          ]
        : [];
    })
    .sort(
      (a, b) =>
        RANK[a.reason] - RANK[b.reason] ||
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
        a.identifier.localeCompare(b.identifier, undefined, { numeric: true }),
    );
  return {
    inProgress: open.filter((i) => i.state.type === "started").length,
    overdue: open.filter((i) => i.dueDate && i.dueDate < today).length,
    dueToday: open.filter((i) => i.dueDate === today).length,
    doneToday: issues.filter((i) => i.state.type === "completed").length,
    items,
  };
}
