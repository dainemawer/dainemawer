"use client";

import { useActionState } from "react";
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
import type { Customer } from "@/db/schema";
import { saveCustomer } from "@/lib/actions/customers";
import { initialFormState } from "@/lib/actions/form-state";
import { CURRENCIES, type Currency } from "@/lib/money";

export function CustomerForm({
  customer,
  defaults,
  returnTo,
}: {
  customer?: Customer;
  defaults: { currency: Currency; termsDays: number };
  returnTo?: string;
}) {
  const [state, action, pending] = useActionState(
    saveCustomer,
    initialFormState,
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="grid max-w-2xl gap-6">
      {customer ? <input type="hidden" name="id" value={customer.id} /> : null}
      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="company"
          label="Company or client name"
          errors={errors.company}
        >
          <Input
            id="company"
            name="company"
            required
            defaultValue={customer?.company}
            {...invalid("company", errors.company)}
          />
        </Field>
        <Field
          id="contactName"
          label="Contact name"
          hint="Used in the email greeting."
        >
          <Input
            id="contactName"
            name="contactName"
            defaultValue={customer?.contactName ?? ""}
          />
        </Field>
        <Field
          id="emails"
          label="Billing email(s)"
          hint="Separate several with commas; all of them receive documents."
          errors={errors.emails}
        >
          <Input
            id="emails"
            name="emails"
            required
            defaultValue={customer?.emails.join(", ")}
            {...invalid("emails", errors.emails)}
          />
        </Field>
        <Field id="ccEmail" label="CC email" errors={errors.ccEmail}>
          <Input
            id="ccEmail"
            name="ccEmail"
            type="email"
            defaultValue={customer?.ccEmail ?? ""}
            {...invalid("ccEmail", errors.ccEmail)}
          />
        </Field>
        <Field id="address" label="Billing address" className="sm:col-span-2">
          <Textarea
            id="address"
            name="address"
            rows={3}
            defaultValue={customer?.address ?? ""}
          />
        </Field>
        <Field id="taxNumber" label="Tax / VAT number">
          <Input
            id="taxNumber"
            name="taxNumber"
            defaultValue={customer?.taxNumber ?? ""}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="currency" label="Currency">
            <Select
              name="currency"
              defaultValue={customer?.currency ?? defaults.currency}
            >
              <SelectTrigger id="currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="termsDays" label="Terms (days)" errors={errors.termsDays}>
            <Input
              id="termsDays"
              name="termsDays"
              type="number"
              min={0}
              max={365}
              defaultValue={customer?.termsDays ?? defaults.termsDays}
              {...invalid("termsDays", errors.termsDays)}
            />
          </Field>
        </div>
        <Field
          id="notes"
          label="Private notes"
          hint="Never shown to the customer."
          className="sm:col-span-2"
        >
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={customer?.notes ?? ""}
          />
        </Field>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : customer ? "Save changes" : "Create customer"}
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
