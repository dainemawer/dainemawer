/** What a form's Server Action returns when it doesn't redirect. */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  ok?: boolean;
};

export const initialFormState: FormState = {};

/** Flattens a zod error into per-field messages for the form to show. */
export function fieldErrorsFrom(
  issues: { path: PropertyKey[]; message: string }[],
) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    // "emails.0" (one bad entry in a list field) reports on the field
    // itself; "lines.0.description" keeps its index for the line editor.
    const path = issue.path.map(String);
    while (path.length > 1 && /^\d+$/.test(path[path.length - 1])) path.pop();
    const key = path.join(".");
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}
