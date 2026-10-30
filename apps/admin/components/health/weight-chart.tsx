import { addDays, formatDate } from "@/lib/documents";
import {
  daysBetween,
  formatKg,
  PLAN,
  planTarget,
  type TrendPoint,
} from "@/lib/health";

// The trend is the line (ink, 2px); each weigh-in is a faint dot, so a
// heavy morning reads as noise around it, not as failure. The plan runs
// dashed from its start weight to the goal, and the axis reaches the plan's
// goal date so the road ahead is visible. Every dot carries a native
// tooltip; the sr-only table is the text view.

const PAD = { top: 12, right: 12, bottom: 28, left: 52 };

export function WeightChart({
  points,
  startKg,
  planGoal,
  compact = false,
}: {
  points: TrendPoint[];
  startKg: number | null;
  planGoal: string | null;
  /** A phone's width: drawn at about its real size, with fewer labels. */
  compact?: boolean;
}) {
  const W = compact ? 360 : 720;
  const H = compact ? 200 : 240;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  // Two weeks before the plan at most, so the start has some context.
  const shown = points.filter((p) => p.date >= addDays(PLAN.start, -14));
  const first = shown[0];
  const latest = shown.at(-1);
  if (!first || !latest) return null;

  // biome-ignore lint/complexity/useMathMinMax: ISO date strings, not numbers
  const from = first.date < PLAN.start ? first.date : PLAN.start;
  const to = planGoal && planGoal > latest.date ? planGoal : latest.date;
  const span = Math.max(daysBetween(from, to), 7);
  const x = (date: string) =>
    PAD.left + (daysBetween(from, date) / span) * plotW;

  const weights = shown.flatMap((p) =>
    p.kg === null ? [p.trend] : [p.kg, p.trend],
  );
  const low = Math.floor(Math.min(...weights, PLAN.goalKg) - 0.5);
  const high = Math.ceil(Math.max(...weights, startKg ?? 0) + 0.5);
  const y = (kg: number) => PAD.top + ((high - kg) / (high - low)) * plotH;
  const ticks = Array.from(
    { length: high - low + 1 },
    (_, i) => low + i,
  ).filter((_, i, all) => all.length <= 8 || i % 2 === 0);
  // A label every Monday, thinned out to fit.
  const mondays: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (new Date(`${d}T00:00:00Z`).getUTCDay() === 1) mondays.push(d);
  }
  const every = Math.ceil(mondays.length / (compact ? 4 : 8));
  const short = (date: string) => formatDate(date).replace(/ \d{4}$/, "");

  const trendPath = shown
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.trend).toFixed(1)}`,
    )
    .join("");
  const planEnd = planGoal ?? to;

  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <Legend mark={<span className="h-0.5 w-4 rounded-full bg-ink" />}>
          Trend
        </Legend>
        <Legend mark={<span className="size-1.5 rounded-full bg-ink/30" />}>
          Weigh-ins
        </Legend>
        {startKg !== null ? (
          <Legend
            mark={
              <span className="w-4 border-t-2 border-dashed border-ink/40" />
            }
          >
            Plan, {PLAN.kgPerWeek} kg a week
          </Legend>
        ) : null}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full text-ink"
        role="img"
        aria-label={`Weight trend: ${formatKg(latest.trend)} on ${formatDate(latest.date)}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="stroke-ink/[0.07]"
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              className="fill-muted-foreground"
            >
              {t} kg
            </text>
          </g>
        ))}
        {mondays
          .filter((_, i) => i % every === 0)
          .map((d) => (
            <text
              key={d}
              x={x(d)}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              className="fill-muted-foreground"
            >
              {short(d)}
            </text>
          ))}

        {/* The goal, and the plan's straight line to it. */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(PLAN.goalKg)}
          y2={y(PLAN.goalKg)}
          className="stroke-ink/25"
        />
        {startKg !== null ? (
          <line
            x1={x(PLAN.start)}
            y1={y(startKg)}
            x2={x(planEnd)}
            y2={y(planTarget(startKg, planEnd))}
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeLinecap="round"
            className="stroke-ink/40"
          />
        ) : null}

        {shown.map((p) =>
          p.kg === null ? null : (
            <g key={p.date}>
              <title>{`${formatDate(p.date)}: ${formatKg(p.kg)} (trend ${formatKg(p.trend)})`}</title>
              <circle cx={x(p.date)} cy={y(p.kg)} r={8} fill="transparent" />
              <circle
                cx={x(p.date)}
                cy={y(p.kg)}
                r={2.5}
                className="fill-ink/30"
              />
            </g>
          ),
        )}
        <path
          d={trendPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={x(latest.date)}
          cy={y(latest.trend)}
          r={4}
          strokeWidth={2}
          className="fill-ink stroke-surface"
        />
      </svg>
      <table className="sr-only">
        <caption>Weight by day</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Weigh-in</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.date}>
              <td>{formatDate(p.date)}</td>
              <td>{p.kg === null ? "—" : formatKg(p.kg)}</td>
              <td>{formatKg(p.trend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Legend({
  mark,
  children,
}: {
  mark: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className="inline-flex items-center">
        {mark}
      </span>
      {children}
    </span>
  );
}
