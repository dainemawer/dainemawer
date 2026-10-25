import type { RecurringStatus } from "@/lib/recurring-dates";
import { cn } from "@/lib/utils";

const styles: Record<RecurringStatus, string> = {
  active: "border-ink/30 text-ink",
  paused: "border-warning/40 bg-warning/5 text-warning",
  ended: "border-border text-muted-foreground",
};

export function RecurringStatusBadge({ status }: { status: RecurringStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium capitalize",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
