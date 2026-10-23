"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
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
import type { Settings } from "@/db/schema";
import { initialFormState } from "@/lib/actions/form-state";
import { saveSettings } from "@/lib/actions/settings";
import { CURRENCIES } from "@/lib/money";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/templates";
import { formatTaxRate } from "@/lib/totals";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(
    saveSettings,
    initialFormState,
  );
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) toast.success("Settings saved.");
  }, [state]);

  const text = (
    name: keyof Settings,
    label: string,
    opts: { hint?: string; type?: string } = {},
  ) => (
    <Field id={name} label={label} hint={opts.hint} errors={errors[name]}>
      <Input
        id={name}
        name={name}
        type={opts.type ?? "text"}
        defaultValue={(settings[name] as string | number | null) ?? ""}
        {...invalid(name, errors[name])}
      />
    </Field>
  );
  const area = (
    name: keyof Settings,
    label: string,
    rows: number,
    hint?: string,
  ) => (
    <Field
      id={name}
      label={label}
      hint={hint}
      errors={errors[name]}
      className="sm:col-span-2"
    >
      <Textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={(settings[name] as string | null) ?? ""}
        {...invalid(name, errors[name])}
      />
    </Field>
  );

  return (
    <form action={action} className="grid max-w-3xl gap-12">
      <Section
        title="Business details"
        description="The “from” block on every PDF."
      >
        {text("businessName", "Business name")}
        {text("taxNumber", "Tax / VAT number")}
        {text("email", "Email", { type: "email" })}
        {text("phone", "Phone")}
        {text("website", "Website")}
        <div />
        {area("address", "Address", 3)}
      </Section>

      <Section title="Payment details" description="Printed on every invoice.">
        {area(
          "bankDetails",
          "Bank details",
          5,
          "Bank, account name, account number, branch code, SWIFT/IBAN for international clients.",
        )}
      </Section>

      <Section
        title="Defaults"
        description="Used for new customers and documents."
      >
        <Field id="defaultCurrency" label="Currency">
          <Select
            name="defaultCurrency"
            defaultValue={settings.defaultCurrency}
          >
            <SelectTrigger id="defaultCurrency" className="w-full">
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
          id="defaultTaxRateBp"
          label="Tax rate (%)"
          hint="0 if you don't charge VAT."
          errors={errors.defaultTaxRateBp}
        >
          <Input
            id="defaultTaxRateBp"
            name="defaultTaxRateBp"
            inputMode="decimal"
            defaultValue={formatTaxRate(settings.defaultTaxRateBp)}
            {...invalid("defaultTaxRateBp", errors.defaultTaxRateBp)}
          />
        </Field>
        {text("defaultTermsDays", "Payment terms (days)", { type: "number" })}
        {text("quoteValidityDays", "Quotes valid for (days)", {
          type: "number",
        })}
        {area(
          "quoteTerms",
          "Default quote terms",
          4,
          "e.g. “A 50% deposit is due on acceptance; the balance on delivery.”",
        )}
        {area("invoiceTerms", "Default invoice terms", 4)}
        {area("defaultNotes", "Default notes", 2)}
      </Section>

      <Section
        title="Email templates"
        description={`Placeholders: ${TEMPLATE_PLACEHOLDERS.map((p) => `{${p}}`).join(" ")}. You can edit the message before each send.`}
      >
        {text("quoteEmailSubject", "Quote subject")}
        <div />
        {area("quoteEmailBody", "Quote message", 7)}
        {text("invoiceEmailSubject", "Invoice subject")}
        <div />
        {area("invoiceEmailBody", "Invoice message", 7)}
      </Section>

      <div className="flex items-center gap-4 border-t pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="grid gap-6">
      <div>
        <legend className="text-lg font-bold">{title}</legend>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
