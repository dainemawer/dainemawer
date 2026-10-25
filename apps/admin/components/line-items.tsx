"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Field, invalid } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Currency, formatMoney, parseMoney } from "@/lib/money";
import { computeTotals, parseQuantity, parseTaxRate } from "@/lib/totals";
import { cn } from "@/lib/utils";

// The line editor and totals box shared by the invoice/quote form and the
// recurring invoice form. The form owns the state (useLineItems) and passes
// it to both pieces.

export type LineInput = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type Line = LineInput & { key: string };

type Errors = Record<string, string[] | undefined>;

const newLine = (): Line => ({
  key: crypto.randomUUID(),
  description: "",
  quantity: "1",
  unitPrice: "",
});

export function useLineItems(
  initial: LineInput[],
  pricing: { discount: string; taxRate: string },
) {
  const [lines, setLines] = useState<Line[]>(() =>
    // Index keys for the server-rendered lines (random ones would differ
    // between server and client and break hydration); random after that.
    (initial.length ? initial : [newLine()]).map((line, index) => ({
      ...line,
      key: `initial-${index}`,
    })),
  );
  // Live totals with the same arithmetic the server stores. Unparseable
  // inputs count as zero here; the server rejects them on save.
  const totals = computeTotals(
    lines.map((line) => ({
      quantityHundredths: parseQuantity(line.quantity || "0") ?? 0,
      unitPriceMinor: parseMoney(line.unitPrice || "0") ?? 0,
    })),
    parseMoney(pricing.discount || "0") ?? 0,
    parseTaxRate(pricing.taxRate || "0") ?? 0,
  );
  return {
    lines,
    setLines,
    totals,
    /** The lines as the Server Action takes them. */
    values: (): LineInput[] => lines.map(({ key: _key, ...line }) => line),
  };
}

type LineItems = ReturnType<typeof useLineItems>;

export function LineItemsEditor({
  items: { lines, setLines, totals },
  currency,
  errors,
}: {
  items: LineItems;
  currency: Currency;
  errors: Errors;
}) {
  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  return (
    <fieldset>
      <legend className="mb-3 text-lg font-bold">Line items</legend>
      <div className="hidden grid-cols-[1fr_6rem_9rem_9rem_2.25rem] gap-3 border-b pb-2 text-xs text-muted-foreground md:grid">
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">Amount</span>
        <span />
      </div>
      <ol className="grid">
        {lines.map((line, index) => {
          const at = (field: string) => errors[`lines.${index}.${field}`];
          const id = (field: string) => `line-${line.key}-${field}`;
          return (
            <li
              key={line.key}
              className="grid grid-cols-[1fr_1fr_2.25rem] gap-3 border-b py-3 md:grid-cols-[1fr_6rem_9rem_9rem_2.25rem] md:items-start"
            >
              <div className="col-span-3 md:col-span-1">
                <label htmlFor={id("description")} className="sr-only">
                  Line {index + 1} description
                </label>
                <Textarea
                  id={id("description")}
                  rows={1}
                  placeholder="What you're charging for"
                  value={line.description}
                  onChange={(e) =>
                    updateLine(line.key, { description: e.target.value })
                  }
                  className="min-h-9 resize-y"
                  {...invalid(id("description"), at("description"))}
                />
                <LineError id={id("description")} errors={at("description")} />
              </div>
              <div>
                <label
                  htmlFor={id("quantity")}
                  className="text-xs text-muted-foreground md:sr-only"
                >
                  Qty
                </label>
                <Input
                  id={id("quantity")}
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.key, { quantity: e.target.value })
                  }
                  className="text-right tabular-nums"
                  {...invalid(id("quantity"), at("quantity"))}
                />
                <LineError id={id("quantity")} errors={at("quantity")} />
              </div>
              <div>
                <label
                  htmlFor={id("unitPrice")}
                  className="text-xs text-muted-foreground md:sr-only"
                >
                  Unit price
                </label>
                <Input
                  id={id("unitPrice")}
                  inputMode="decimal"
                  placeholder="0.00"
                  value={line.unitPrice}
                  onChange={(e) =>
                    updateLine(line.key, { unitPrice: e.target.value })
                  }
                  className="text-right tabular-nums"
                  {...invalid(id("unitPrice"), at("unitPrice"))}
                />
                <LineError id={id("unitPrice")} errors={at("unitPrice")} />
              </div>
              <output
                htmlFor={`${id("quantity")} ${id("unitPrice")}`}
                className="hidden h-9 items-center justify-end text-sm tabular-nums md:flex"
              >
                {formatMoney(totals.lineAmounts[index] ?? 0, currency)}
              </output>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end md:self-start"
                aria-label={`Remove line ${index + 1}`}
                disabled={lines.length === 1}
                onClick={() =>
                  setLines((current) =>
                    current.filter((l) => l.key !== line.key),
                  )
                }
              >
                <X />
              </Button>
            </li>
          );
        })}
      </ol>
      {errors.lines ? (
        <p className="mt-2 text-xs text-destructive">{errors.lines[0]}</p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => setLines((current) => [...current, newLine()])}
      >
        <Plus /> Add line
      </Button>
    </fieldset>
  );
}

export function TotalsBox({
  items: { totals },
  currency,
  discount,
  taxRate,
  onChange,
  errors,
}: {
  items: LineItems;
  currency: Currency;
  discount: string;
  taxRate: string;
  onChange: (field: "discount" | "taxRate", value: string) => void;
  errors: Errors;
}) {
  return (
    <div className="grid content-start gap-4 rounded-lg border p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field id="discount" label="Discount" errors={errors.discount}>
          <Input
            id="discount"
            inputMode="decimal"
            placeholder="0.00"
            value={discount}
            onChange={(e) => onChange("discount", e.target.value)}
            className="text-right tabular-nums"
            {...invalid("discount", errors.discount)}
          />
        </Field>
        <Field id="taxRate" label="Tax %" errors={errors.taxRate}>
          <Input
            id="taxRate"
            inputMode="decimal"
            value={taxRate}
            onChange={(e) => onChange("taxRate", e.target.value)}
            className="text-right tabular-nums"
            {...invalid("taxRate", errors.taxRate)}
          />
        </Field>
      </div>
      <dl className="grid gap-1 text-sm tabular-nums">
        <TotalRow
          label="Subtotal"
          value={formatMoney(totals.subtotalMinor, currency)}
        />
        {totals.discountMinor ? (
          <TotalRow
            label="Discount"
            value={`−${formatMoney(totals.discountMinor, currency)}`}
          />
        ) : null}
        {totals.taxMinor ? (
          <TotalRow
            label="Tax"
            value={formatMoney(totals.taxMinor, currency)}
          />
        ) : null}
        <TotalRow
          label={`Total ${currency}`}
          value={formatMoney(totals.totalMinor, currency)}
          strong
        />
      </dl>
    </div>
  );
}

function LineError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.length ? (
    <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
      {errors[0]}
    </p>
  ) : null;
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        strong && "mt-2 border-t pt-2 text-base font-bold",
      )}
    >
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
