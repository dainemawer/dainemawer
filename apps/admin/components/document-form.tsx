"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
import { type DocumentInput, saveDocument } from "@/lib/actions/documents";
import type { FormState } from "@/lib/actions/form-state";
import { addDays, type DocumentKind } from "@/lib/documents";
import { CURRENCIES, type Currency } from "@/lib/money";

export type CustomerOption = {
  id: string;
  company: string;
  currency: Currency;
  termsDays: number;
};

export type DocumentFormValues = Omit<DocumentInput, "lines" | "kind"> & {
  lines: LineInput[];
};

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
  const items = useLineItems(initial.lines, values);
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

  const currency = values.currency as Currency;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveDocument({
        ...values,
        kind,
        lines: items.values(),
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

      <LineItemsEditor items={items} currency={currency} errors={errors} />

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
