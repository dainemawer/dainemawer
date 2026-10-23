// Fills the email templates from Settings: `{number}`, `{total}` etc.
// Unknown placeholders are left as typed so a typo is visible in the
// send dialog rather than silently blanked.

export const TEMPLATE_PLACEHOLDERS = [
  "number",
  "business",
  "contact",
  "company",
  "total",
  "validUntil",
  "dueDate",
] as const;

export type TemplateVars = Record<
  (typeof TEMPLATE_PLACEHOLDERS)[number],
  string
>;

export function fillTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key as keyof TemplateVars] : match,
  );
}
