import { Bone } from "@/components/skeletons";
import { formatDate } from "@/lib/documents";
import { getLinearToday, linearConfigured } from "@/lib/linear";
import type { TodayItem } from "@/lib/linear-today";
import { cn } from "@/lib/utils";

// The HUD's Linear tile: what's late, due, under way and urgent among your
// assigned issues, and how much you've closed today. Data, so it streams in
// its own <Suspense> on the dashboard.

const MAX_ITEMS = 6;

const REASON: Record<TodayItem["reason"], string> = {
  overdue: "Overdue",
  due: "Due today",
  started: "In progress",
  urgent: "Urgent",
  high: "High",
};

export async function LinearTile() {
  if (!linearConfigured()) {
    return (
      <Frame>
        <p className="mt-1 text-sm">Linear isn't connected.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Set LINEAR_API_KEY to a personal API key.
        </p>
      </Frame>
    );
  }
  const today = await getLinearToday();
  if (!today) {
    return (
      <Frame>
        <p className="mt-1 text-sm text-muted-foreground">
          Couldn't reach Linear just now.
        </p>
      </Frame>
    );
  }
  const summary = [
    today.inProgress && `${today.inProgress} in progress`,
    today.overdue && `${today.overdue} overdue`,
    today.dueToday && `${today.dueToday} due today`,
    today.doneToday && `${today.doneToday} done today`,
  ].filter(Boolean);
  const shown = today.items.slice(0, MAX_ITEMS);
  const more = today.items.length - shown.length;

  return (
    <Frame>
      <p className="mt-1 text-sm">
        {summary.length ? summary.join(" · ") : "Nothing on for today"}
      </p>
      {shown.length ? (
        <ul className="mt-3 divide-y border-y text-sm">
          {shown.map((item) => (
            <li key={item.identifier}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-baseline gap-3 py-1.5 hover:bg-muted/60"
              >
                <span className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">
                  {item.identifier}
                </span>
                <span
                  className="min-w-0 flex-1 truncate"
                  title={
                    item.project
                      ? `${item.title} · ${item.project}`
                      : item.title
                  }
                >
                  {item.title}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    item.reason === "overdue"
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {REASON[item.reason]}
                  {item.reason === "overdue" && item.dueDate
                    ? ` · ${formatDate(item.dueDate)}`
                    : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {more > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">+{more} more</p>
      ) : null}
    </Frame>
  );
}

export function LinearSkeleton() {
  return (
    <Frame>
      <p className="mt-1 text-sm">
        <Bone w="26ch" />
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {["34ch", "28ch", "40ch", "24ch"].map((w) => (
          <li key={w}>
            <Bone w={w} />
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section aria-label="Linear" className="border-t pt-3 xl:col-span-2">
      <p className="text-xs text-muted-foreground">Linear</p>
      {children}
    </section>
  );
}
