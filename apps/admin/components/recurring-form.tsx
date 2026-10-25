"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { CustomerOption } from "@/components/document-form";
import { Field, invalid } from "@/components/field";
import {
  type LineInput,
  LineItemsEditor,
  TotalsBox,
  useLineItems,
} from "@/components/line-items";
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
import type { FormState } from "@/lib/actions/form-state";
import { type RecurringInput, saveRecurring } from "@/lib/actions/recurring";
import { CURRENCIES, type Currency } from "@/lib/money";
import {
  INTERVAL_LABEL,
  INTERVALS,
  type Interval,
} from "@/lib/recurring-dates";

export type RecurringFormValues = Omit<RecurringInput, "lines"> & {
  lines: LineInput[];
};

export function RecurringForm({
  customers,
  initial,
}: {
  customers: CustomerOption[];
  initial: RecurringFormValues;
}) {
  const [values, setValues] = useState(initial);
  const items = useLineItems(initial.lines, values);
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};
  const currency = values.currency as Currency;
  const customer = customers.find((c) => c.id === values.customerId);

  const set = <K extends keyof RecurringFormValues>(
    key: K,
    value: RecurringFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  function chooseCustomer(customerId: string) {
    const chosen = customers.find((c) => c.id === customerId);
    setValues((current) => ({
      ...current,
      customerId,
      ...(chosen && !current.id ? { currency: chosen.currency } : {}),
    }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveRecurring({ ...values, lines: items.values() });
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
            customer ? (
              `Each invoice is due ${customer.termsDays} days after it's issued, from this customer's payment terms.`
            ) : (
              <Link
                href="/customers/new?returnTo=%2Frecurring%2Fnew"
                className="underline underline-offset-4 hover:text-ink"
              >
                Add a new customer
              </Link>
            )
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
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.company}
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
        <Field id="interval" label="Repeats">
          <Select
            value={values.interval}
            onValueChange={(value) => set("interval", value as Interval)}
          >
            <SelectTrigger id="interval" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVALS.map((interval) => (
                <SelectItem key={interval} value={interval}>
                  {INTERVAL_LABEL[interval]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          id="nextIssueDate"
          label={values.id ? "Next invoice" : "First invoice"}
          errors={errors.nextIssueDate}
          hint="Later invoices land on the same day of the month."
        >
          <Input
            id="nextIssueDate"
            type="date"
            value={values.nextIssueDate}
            onChange={(e) => set("nextIssueDate", e.target.value)}
            {...invalid("nextIssueDate", errors.nextIssueDate)}
          />
        </Field>
        <Field
          id="endDate"
          label="Ends"
          errors={errors.endDate}
          hint="Optional. Leave empty to repeat until you stop it."
        >
          <Input
            id="endDate"
            type="date"
            value={values.endDate ?? ""}
            onChange={(e) => set("endDate", e.target.value)}
            {...invalid("endDate", errors.endDate)}
          />
        </Field>
        <Field
          id="title"
          label="Title"
          hint="Optional, e.g. “Monthly retainer”."
          className="sm:col-span-2"
        >
          <Input
            id="title"
            value={values.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
          />
        </Field>
      </div>

      <LineItemsEditor items={items} currency={currency} errors={errors} />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="grid content-start gap-6">
          <Field id="notes" label="Notes" hint="Shown on each invoice's PDF.">
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
        <TotalsBox
          items={items}
          currency={currency}
          discount={values.discount}
          taxRate={values.taxRate}
          onChange={set}
          errors={errors}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : values.id
              ? "Save changes"
              : "Create recurring invoice"}
        </Button>
        <Button asChild variant="ghost">
          <Link href={values.id ? `/recurring/${values.id}` : "/recurring"}>
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
