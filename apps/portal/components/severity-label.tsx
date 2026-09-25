import { colors } from "@/lib/tokens";

// Plain monospace text, no ticks — matches what the design mockup actually
// shipped for severity (unlike status/estimate, which both fill a bar).
export function SeverityLabel({
  severity,
}: {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
  return (
    <span style={{ fontFamily: "monospace", color: colors.muted }}>
      {severity.toLowerCase()}
    </span>
  );
}
