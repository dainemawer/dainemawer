import { type Currency, formatMoney } from "@/lib/money";

type Month = { month: string; invoiced: number; paid: number };

// Invoiced vs paid per month: paired thin bars on one axis, ink for the
// money that arrived, light grey for what was billed. Each bar carries a
// native tooltip; the table under the chart (sr-only) is the text view.

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 64 };
const BAR = 10;

export function MonthlyChart({
  data,
  currency,
}: {
  data: Month[];
  currency: Currency;
}) {
  const max = Math.max(...data.flatMap((d) => [d.invoiced, d.paid]), 1);
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
        <Legend swatch="bg-[#c4c4c4]" label="Invoiced" />
        <Legend swatch="bg-ink" label="Paid" />
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Invoiced and paid per month, last 12 months, ${currency}`}
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
              <Bar
                x={cx - BAR - 1}
                value={d.invoiced}
                y={y}
                base={y(0)}
                fill="#c4c4c4"
                title={`${monthLabel(d.month)} invoiced: ${formatMoney(d.invoiced, currency)}`}
              />
              <Bar
                x={cx + 1}
                value={d.paid}
                y={y}
                base={y(0)}
                fill="#111111"
                title={`${monthLabel(d.month)} paid: ${formatMoney(d.paid, currency)}`}
              />
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
        <caption>Invoiced and paid per month ({currency})</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Invoiced</th>
            <th>Paid</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{formatMoney(d.invoiced, currency)}</td>
              <td>{formatMoney(d.paid, currency)}</td>
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
