import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + control + hint/error, wired up with ids for screen readers. */
export function Field({
  id,
  label,
  hint,
  errors,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  errors?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  const error = errors?.[0];
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props that mark a control invalid and point it at its error message. */
export function invalid(id: string, errors?: string[]) {
  return errors?.length
    ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` }
    : {};
}
