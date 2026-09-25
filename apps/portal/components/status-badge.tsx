import { colors } from "@/lib/tokens";

const STAGES = [
  "SUBMITTED",
  "ESTIMATED",
  "APPROVED",
  "IN_PROGRESS",
  "DONE",
] as const;

// "One badge, everywhere" — ticks fill in as work moves forward, so status
// reads without relying on color (see the Design brief's component legend).
export function StatusBadge({ status }: { status: (typeof STAGES)[number] }) {
  const filled = STAGES.indexOf(status) + 1;
  const ticks = STAGES.map((_, i) => (i < filled ? "●" : "○")).join("");
  const label = status.toLowerCase().replace("_", " ");

  return (
    <span style={{ fontFamily: "monospace", color: colors.muted }}>
      {ticks} {label}
    </span>
  );
}
