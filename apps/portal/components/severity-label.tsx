// Plain monospace text, no ticks — matches what the design mockup actually
// shipped for severity (unlike status/estimate, which both fill a bar).
export function SeverityLabel({
  severity,
}: {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
  return (
    <span className="font-mono text-muted text-sm">
      {severity.toLowerCase()}
    </span>
  );
}
