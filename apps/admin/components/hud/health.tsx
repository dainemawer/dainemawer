import { Check } from "lucide-react";
import Link from "next/link";
import { Bone } from "@/components/skeletons";
import { formatDate } from "@/lib/documents";
import { formatKg, PLAN } from "@/lib/health";
import { getHealth } from "@/lib/health-data";
import { cn } from "@/lib/utils";

// The HUD's health strip: the weight trend and today's habits at a glance,
// a full row under the other tiles. Data, so it streams in its own
// <Suspense> on the dashboard. /health has the rest.

export async function HealthTile() {
  const health = await getHealth();
  const { today } = health;
  const pace =
    health.weeklyKg === null
      ? null
      : `${formatKg(health.weeklyKg, { signed: true })} this week`;
  const goal = health.planGoal
    ? `${PLAN.goalKg} kg by ${formatDate(health.planGoal)}`
    : `Goal ${PLAN.goalKg} kg`;

  return (
    <Frame>
      <div className="min-w-0">
        <p className="mt-1 text-xl font-medium tabular-nums">
          {health.trendKg === null
            ? "No weigh-ins yet"
            : formatKg(health.trendKg)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[pace, goal].filter(Boolean).join(" · ")}
        </p>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Habit done={(today.steps ?? 0) >= PLAN.steps}>
          {today.steps === null
            ? "No steps yet"
            : `${new Intl.NumberFormat("en-GB").format(today.steps)} steps`}
        </Habit>
        <Habit done={today.proteinMeals === PLAN.proteinMeals}>
          Protein {today.proteinMeals ?? 0}/{PLAN.proteinMeals}
        </Habit>
        <Habit done={today.kitchenClosed === true}>
          Kitchen closed at {PLAN.kitchenCloses}
        </Habit>
        <Habit done={health.workoutsThisWeek >= PLAN.workoutsPerWeek}>
          Moved {health.workoutsThisWeek}/{PLAN.workoutsPerWeek} this week
        </Habit>
      </ul>
    </Frame>
  );
}

export function HealthSkeleton() {
  return (
    <Frame>
      <div>
        <p className="mt-1 text-xl">
          <Bone w="8ch" />
        </p>
        <p className="mt-0.5 text-xs">
          <Bone w="24ch" />
        </p>
      </div>
      <p className="text-sm">
        <Bone w="44ch" />
      </p>
    </Frame>
  );
}

function Habit({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1.5",
        !done && "text-muted-foreground",
      )}
    >
      {done ? (
        <Check aria-hidden="true" className="size-4 text-ink" />
      ) : (
        <span
          aria-hidden="true"
          className="inline-block size-4 rounded-full border border-ink/25"
        />
      )}
      {children}
      {done ? <span className="sr-only"> (done)</span> : null}
    </li>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section
      aria-label="Health"
      className="border-t pt-3 md:col-span-2 xl:col-span-3"
    >
      <p className="text-xs text-muted-foreground">
        <Link
          href="/health"
          className="underline-offset-4 hover:text-ink hover:underline"
        >
          Health
        </Link>
      </p>
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
        {children}
      </div>
    </section>
  );
}
