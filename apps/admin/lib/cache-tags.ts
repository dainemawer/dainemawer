// Cache tags for the `use cache` reads in lib/queries.ts and lib/dashboard.ts.
// Each cached read tags every table it touches; each write expires the tags
// of the tables it changed (updateTag in Server Actions, revalidateTag in
// the cron route). Deliberately coarse: one tag per table is plenty for a
// one-person back office and can't miss a dependent page.

export const TAG = {
  customers: "customers",
  documents: "documents",
  settings: "settings",
  recurring: "recurring",
  expenses: "expenses",
  health: "health",
  /** Linear projects: expired by its webhook, not by a table write. */
  projects: "projects",
  /** Your Linear issues (the HUD): expired by the same webhook. */
  issues: "issues",
} as const;
