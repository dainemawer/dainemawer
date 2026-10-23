"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Field, invalid } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type DocumentInput, saveDocument } from "@/lib/actions/documents";
import type { FormState } from "@/lib/actions/form-state";
import { addDays, type DocumentKind } from "@/lib/documents";
import {
  CURRENCIES,
  type Currency,
  formatMoney,
  parseMoney,
} from "@/lib/money";
import { computeTotals, parseQuantity, parseTaxRate } from "@/lib/totals";
import { cn } from "@/lib/utils";

export type CustomerOption = {
  id: string;
  company: string;
  currency: Currency;
  termsDays: number;
};

type Line = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export type DocumentFormValues = Omit<DocumentInput, "lines" | "kind"> & {
  lines: Omit<Line, "key">[];
};

const newLine = (): Line => ({
  key: crypto.randomUUID(),
  description: "",
  quantity: "1",
  unitPrice: "",
});

export function DocumentForm({
  kind,
  customers,
  initial,
  number,
}: {
  kind: DocumentKind;
  customers: CustomerOption[];
  initial: DocumentFormValues;
  number?: string;
}) {
  const [values, setValues] = useState(initial);
  const [lines, setLines] = useState<Line[]>(() =>
    // Index keys for the server-rendered lines (random ones would differ
    // between server and client and break hydration); random after that.
    (initial.lines.length ? initial.lines : [newLine()]).map((line, index) => ({
      ...line,
      key: `initial-${index}`,
    })),
  );
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};
  const isQuote = kind === "quote";
  const returnTo = `/${isQuote ? "quotes" : "invoices"}/new`;

  const set = <K extends keyof DocumentFormValues>(
    key: K,
    value: DocumentFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  function chooseCustomer(customerId: string) {
    const customer = customers.find((c) => c.id === customerId);
    setValues((current) => ({
      ...current,
      customerId,
      // A new document follows the customer's currency and payment terms.
      ...(customer && !current.id
        ? {
            currency: customer.currency,
            dueDate: isQuote
              ? current.dueDate
              : addDays(current.issueDate, customer.termsDays),
          }
        : {}),
    }));
  }

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  // Live totals with the same arithmetic the server stores. Unparseable
  // inputs count as zero here; the server rejects them on save.
  const currency = values.currency as Currency;
  const totals = computeTotals(
    lines.map((line) => ({
      quantityHundredths: parseQuantity(line.quantity || "0") ?? 0,
      unitPriceMinor: parseMoney(line.unitPrice || "0") ?? 0,
    })),
    parseMoney(values.discount || "0") ?? 0,
    parseTaxRate(values.taxRate || "0") ?? 0,
  );

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveDocument({
        ...values,
        kind,
        lines: lines.map(({ key: _key, ...line }) => line),
      });
      // Success redirects; anything returned is an error.
      if (result) setState(result);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8" noValidate>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          id="customerId"
          label="Customer"
          errors={errors.customerId}
          className="sm:col-span-2"
          hint={
            <Link
              href={`/customers/new?returnTo=${encodeURIComponent(returnTo)}`}
              className="underline underline-offset-4 hover:text-ink"
            >
              Add a new customer
            </Link>
          }
        >
          <Select
            value={values.customerId || undefined}
            onValueChange={chooseCustomer}
          >
            <SelectTrigger
              id="customerId"
              className="w-full"
              {...invalid("customerId", errors.customerId)}
            >
              <SelectValue placeholder="Choose a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="currency" label="Currency">
          <Select
            value={values.currency}
            onValueChange={(value) => set("currency", value as Currency)}
          >
            <SelectTrigger id="currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          id="number"
          label="Number"
          hint={number ? undefined : "Assigned when saved."}
        >
          <Input
            id="number"
            value={number ?? "—"}
            readOnly
            disabled
            className="tabular-nums"
          />
        </Field>
        <Field id="issueDate" label="Issue date" errors={errors.issueDate}>
          <Input
            id="issueDate"
            type="date"
            value={values.issueDate}
            onChange={(e) => set("issueDate", e.target.value)}
            {...invalid("issueDate", errors.issueDate)}
          />
        </Field>
        {isQuote ? (
          <Field id="validUntil" label="Valid until" errors={errors.validUntil}>
            <Input
              id="validUntil"
              type="date"
              value={values.validUntil ?? ""}
              onChange={(e) => set("validUntil", e.target.value)}
              {...invalid("validUntil", errors.validUntil)}
            />
          </Field>
        ) : (
          <Field id="dueDate" label="Due date" errors={errors.dueDate}>
            <Input
              id="dueDate"
              type="date"
              value={values.dueDate ?? ""}
              onChange={(e) => set("dueDate", e.target.value)}
              {...invalid("dueDate", errors.dueDate)}
            />
          </Field>
        )}
        <Field
          id="title"
          label="Title"
          hint="Optional, e.g. the project name."
          className="sm:col-span-2"
        >
          <Input
            id="title"
            value={values.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
      </div>

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
                  <LineError
                    id={id("description")}
                    errors={at("description")}
                  />
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

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-6">
          <Field id="notes" label="Notes" hint="Shown on the PDF.">
            <Textarea
              id="notes"
              rows={3}
              value={values.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
          <Field id="terms" label="Terms" hint="Defaults come from Settings.">
            <Textarea
              id="terms"
              rows={4}
              value={values.terms ?? ""}
              onChange={(e) => set("terms", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid content-start gap-4 rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="discount" label="Discount" errors={errors.discount}>
              <Input
                id="discount"
                inputMode="decimal"
                placeholder="0.00"
                value={values.discount}
                onChange={(e) => set("discount", e.target.value)}
                className="text-right tabular-nums"
                {...invalid("discount", errors.discount)}
              />
            </Field>
            <Field id="taxRate" label="Tax %" errors={errors.taxRate}>
              <Input
                id="taxRate"
                inputMode="decimal"
                value={values.taxRate}
                onChange={(e) => set("taxRate", e.target.value)}
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
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : values.id ? "Save changes" : `Create ${kind}`}
        </Button>
        <Button asChild variant="ghost">
          <Link
            href={
              values.id
                ? `/${isQuote ? "quotes" : "invoices"}/${values.id}`
                : `/${isQuote ? "quotes" : "invoices"}`
            }
          >
            Cancel
          </Link>
        </Button>
        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>
    </form>
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
