import type { DisplayStatus } from "@/lib/documents";
import { cn } from "@/lib/utils";

// Quiet by default; colour only where a status asks for attention
// (overdue) or confirms money (paid, accepted).
const styles: Record<DisplayStatus, string> = {
  draft: "border-border text-muted-foreground",
  sent: "border-ink/30 text-ink",
  accepted: "border-success/40 bg-success/5 text-success",
  paid: "border-success/40 bg-success/5 text-success",
  declined: "border-border text-muted-foreground line-through",
  expired: "border-warning/40 bg-warning/5 text-warning",
  overdue: "border-destructive/40 bg-destructive/5 text-destructive",
  void: "border-border text-muted-foreground line-through",
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
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
