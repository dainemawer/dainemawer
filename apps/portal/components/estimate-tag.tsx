import { colors } from "@/lib/tokens";

type EstimateTagProps = {
  sizeTier: "SMALL" | "MEDIUM" | "LARGE" | null;
  estimate: { hours: unknown; amount: unknown; confirmed: boolean } | null;
};

// The number only appears once it's been confirmed — see "Real-time cost
// estimation" in the spec: a client never sees a draft figure.
export function EstimateTag({ sizeTier, estimate }: EstimateTagProps) {
  if (!estimate?.confirmed || !sizeTier) {
    return <span style={{ color: colors.faint }}>Pending</span>;
  }

  return (
    <span style={{ fontFamily: "monospace", color: colors.muted }}>
      {sizeTier.toLowerCase()} · {String(estimate.hours)}h · R
      {String(estimate.amount)}
    </span>
  );
}
