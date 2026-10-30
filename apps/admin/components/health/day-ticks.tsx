"use client";

import { Check } from "lucide-react";
import { useActionState, useEffect, useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { invalid } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/lib/actions/form-state";
import {
  type HealthTicks,
  logWeight,
  setHealthTicks,
} from "@/lib/actions/health";
import { PLAN } from "@/lib/health";
import { cn } from "@/lib/utils";

type Ticks = {
  proteinMeals: number | null;
  kitchenClosed: boolean | null;
  workedOut: boolean | null;
};

/**
 * One day's habits, ticked with a tap. Each tap saves on its own and shows
 * at once; the page catches up when the save lands.
 */
export function DayTicks({
  date,
  ticks,
  weightKg,
}: {
  date: string;
  ticks: Ticks;
  weightKg: number | null;
}) {
  const [shown, show] = useOptimistic(
    ticks,
    (current, change: HealthTicks) => ({ ...current, ...change }),
  );
  const [, startTransition] = useTransition();
  const save = (change: HealthTicks) =>
    startTransition(async () => {
      show(change);
      const result = await setHealthTicks(date, change);
      if (result.error) toast.error(result.error);
    });

  return (
    <div className="grid gap-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">
          Meals with a palm of protein
        </legend>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((n) => (
            <Choice
              key={n}
              pressed={shown.proteinMeals === n}
              onClick={() =>
                save({ proteinMeals: shown.proteinMeals === n ? null : n })
              }
              className="w-11"
            >
              {n}
            </Choice>
          ))}
        </div>
      </fieldset>
      <Toggle
        label={`Kitchen closed at ${PLAN.kitchenCloses}`}
        hint="Nothing after, tea and water aside."
        pressed={shown.kitchenClosed === true}
        onClick={() =>
          save({ kitchenClosed: shown.kitchenClosed ? null : true })
        }
      />
      <Toggle
        label="Moved on purpose"
        hint="HIIT, bodyweight or a run. Ten minutes counts."
        pressed={shown.workedOut === true}
        onClick={() => save({ workedOut: shown.workedOut ? null : true })}
      />
      <WeightForm date={date} weightKg={weightKg} />
    </div>
  );
}

function WeightForm({
  date,
  weightKg,
}: {
  date: string;
  weightKg: number | null;
}) {
  const [state, action, pending] = useActionState(
    logWeight.bind(null, date),
    initialFormState,
  );
  const errors = state.fieldErrors ?? {};
  useEffect(() => {
    if (state.ok) toast.success("Weigh-in saved.");
  }, [state]);

  return (
    <form action={action} className="grid gap-2">
      <Label htmlFor={`weight-${date}`}>Weigh-in</Label>
      <div className="flex gap-2">
        <Input
          id={`weight-${date}`}
          name="weight"
          inputMode="decimal"
          placeholder="kg"
          defaultValue={weightKg?.toFixed(1) ?? ""}
          className="w-28"
          {...invalid(`weight-${date}`, errors.weight)}
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {errors.weight ? (
        <p id={`weight-${date}-error`} className="text-xs text-destructive">
          {errors.weight[0]}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only if your scale isn't in Apple Health.
        </p>
      )}
    </form>
  );
}

function Toggle({
  label,
  hint,
  pressed,
  onClick,
}: {
  label: string;
  hint: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="flex items-start gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
          pressed ? "border-ink bg-ink text-surface" : "border-ink/30",
        )}
      >
        {pressed ? <Check className="size-3.5" /> : null}
      </span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

function Choice({
  pressed,
  onClick,
  className,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-9 rounded-md border text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        pressed
          ? "border-ink bg-ink text-surface"
          : "text-muted-foreground hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}
