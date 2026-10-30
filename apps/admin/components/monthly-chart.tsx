import { type Currency, formatMoney } from "@/lib/money";

type Month = { month: string; values: [number, number] };
type Series = { label: string; fill: string; swatch: string };

// Two amounts per month (money in and out on the dashboard): paired thin
// bars on one axis, the first series in ink, the second light grey. Each
// bar carries a native tooltip; the table under the chart (sr-only) is the
// text view.

const SERIES: [Omit<Series, "label">, Omit<Series, "label">] = [
  { fill: "#111111", swatch: "bg-ink" },
  { fill: "#c4c4c4", swatch: "bg-[#c4c4c4]" },
];

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 64 };
const BAR = 10;

export function MonthlyChart({
  data,
  labels,
  title,
  currency,
}: {
  data: Month[];
  /** The two series, in the order of `values`. */
  labels: [string, string];
  /** What the chart shows, for screen readers. */
  title: string;
  currency: Currency;
}) {
  const series = SERIES.map((s, i) => ({ ...s, label: labels[i] }));
  const max = Math.max(...data.flatMap((d) => d.values), 1);
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const slot = plotW / data.length;
  const short = (minor: number) => compact(minor, currency);
  const monthLabel = (m: string) =>
    new Intl.DateTimeFormat("en-GB", {
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${m}-01T00:00:00Z`));

  return (
    <figure>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        {series.map((s) => (
          <Legend key={s.label} swatch={s.swatch} label={s.label} />
        ))}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${title}, ${currency}`}
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
              {short(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + slot * i + slot / 2;
          return (
            <g key={d.month}>
              {series.map((s, j) => (
                <Bar
                  key={s.label}
                  x={j === 0 ? cx - BAR - 1 : cx + 1}
                  value={d.values[j]}
                  y={y}
                  base={y(0)}
                  fill={s.fill}
                  title={`${monthLabel(d.month)} ${s.label.toLowerCase()}: ${formatMoney(d.values[j], currency)}`}
                />
              ))}
              <text
                x={cx}
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
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(0)}
          y2={y(0)}
          stroke="#cfcfcf"
        />
      </svg>
      <table className="sr-only">
        <caption>
          {title} ({currency})
        </caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>{labels[0]}</th>
            <th>{labels[1]}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{formatMoney(d.values[0], currency)}</td>
              <td>{formatMoney(d.values[1], currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Bar({
  x,
  value,
  y,
  base,
  fill,
  title,
}: {
  x: number;
  value: number;
  y: (v: number) => number;
  base: number;
  fill: string;
  title: string;
}) {
  const h = base - y(value);
  // Rounded data end, square at the baseline; a zero still gets a hover target.
  const r = Math.min(4, h, BAR / 2);
  const d =
    h > 0
      ? `M${x},${base}V${base - h + r}Q${x},${base - h} ${x + r},${base - h}H${x + BAR - r}Q${x + BAR},${base - h} ${x + BAR},${base - h + r}V${base}Z`
      : "";
  return (
    <g>
      <title>{title}</title>
      <rect
        x={x - 2}
        y={PAD.top}
        width={BAR + 4}
        height={base - PAD.top}
        fill="transparent"
      />
      {d ? <path d={d} fill={fill} /> : null}
    </g>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block size-2.5 rounded-sm ${swatch}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function compact(minor: number, currency: Currency) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(minor / 100);
}
