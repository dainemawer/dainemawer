import { formatMoney } from "@/lib/money";

type Month = { month: string; spent: number };

// Spending per month: one series, so no legend (the heading names it, and
// the caption explains the dashed average line). Same anatomy as the
// dashboard's MonthlyChart: ink bars with rounded data ends, native
// tooltips, and an sr-only table as the text view. The current month is
// lighter: it isn't over yet.

const W = 720;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 28, left: 64 };
const BAR = 18;

export function SpendingChart({
  data,
  average,
}: {
  data: Month[];
  /** Drawn as a reference line when there's history to average. */
  average: number;
}) {
  const max = Math.max(...data.map((d) => d.spent), average, 1);
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - (Math.max(v, 0) / top) * plotH;
  const slot = plotW / data.length;
  const monthLabel = (m: string, month: "short" | "long" = "short") =>
    new Intl.DateTimeFormat("en-GB", { month, timeZone: "UTC" }).format(
      new Date(`${m}T00:00:00Z`),
    );

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Spending per month"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#ececec"
            />
            <text
              x={PAD.left - 8}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#6b6b6b"
            >
              {compact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + slot * i + (slot - BAR) / 2;
          const base = y(0);
          const h = base - y(d.spent);
          const r = Math.min(4, h, BAR / 2);
          const current = i === data.length - 1;
          const path =
            h > 0
              ? `M${x},${base}V${base - h + r}Q${x},${base - h} ${x + r},${base - h}H${x + BAR - r}Q${x + BAR},${base - h} ${x + BAR},${base - h + r}V${base}Z`
              : "";
          return (
            <g key={d.month}>
              <title>
                {`${monthLabel(d.month, "long")}${current ? " so far" : ""}: ${formatMoney(d.spent, "ZAR")}`}
              </title>
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
              />
              {path ? (
                <path d={path} fill={current ? "#9a9a9a" : "#111111"} />
              ) : null}
              <text
                x={PAD.left + slot * i + slot / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#6b6b6b"
              >
                {monthLabel(d.month)}
              </text>
            </g>
          );
        })}
        {average > 0 ? (
          // Labelled in the caption above the chart, not here, where it
          // would collide with the bars.
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(average)}
            y2={y(average)}
            stroke="#6b6b6b"
            strokeDasharray="4 4"
          />
        ) : null}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(0)}
          y2={y(0)}
          stroke="#cfcfcf"
        />
      </svg>
      <table className="sr-only">
        <caption>Spending per month (ZAR)</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Spent</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{monthLabel(d.month, "long")}</td>
              <td>{formatMoney(d.spent, "ZAR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function compact(minor: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "ZAR",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(minor / 100);
}
