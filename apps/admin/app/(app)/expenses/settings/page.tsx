import type { Metadata } from "next";
import { Suspense } from "react";
import {
  AccountToggle,
  DeleteNoteButton,
  DeleteRuleButton,
  NoteForm,
  RefreshAccountsButton,
} from "@/components/expenses/buttons";
import { CategoryEditor } from "@/components/expenses/categories";
import { ExpensesGate } from "@/components/expenses/gate";
import { PageHeader } from "@/components/page-header";
import {
  Bone,
  Loading,
  Skeleton,
  times,
  widthFor,
} from "@/components/skeletons";
import { getExpenseSettings, getExpensesState } from "@/lib/expenses/queries";

export const metadata: Metadata = { title: "Expenses settings" };

export default function ExpensesSettingsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Expenses", href: "/expenses" }]}
        title="Settings"
        description="Accounts, categories, and the memory the classifier learns from."
      />
      <Suspense
        fallback={
          <Loading>
            <SettingsSkeleton />
          </Loading>
        }
      >
        <ExpensesGate>
          <Settings />
        </ExpensesGate>
      </Suspense>
    </>
  );
}

/** The real section headings, with placeholder accounts, categories and rules. */
function SettingsSkeleton() {
  return (
    <div className="grid gap-12">
      <Section
        id="accounts"
        title="Accounts"
        description="Only included accounts are analysed. Including one labels its last six months; excluding one takes it out of the totals."
      >
        <ul className="mb-3 grid gap-2">
          {times(3, (i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="size-4 rounded-sm border" />
              <Bone w={widthFor(i, 4)} />
              <span className="text-xs">
                <Bone w="10ch" />
              </span>
            </li>
          ))}
        </ul>
        <Skeleton className="h-9 w-36" />
      </Section>
      <Section
        id="categories"
        title="Categories"
        description="The AI reads each description to decide what goes where. A category can only be deleted once nothing uses it."
      >
        <ul className="divide-y border-y">
          {times(6, (i) => (
            <li
              key={i}
              className="grid gap-2 py-3 sm:grid-cols-[12rem_auto_1fr_auto] sm:items-center"
            >
              <div className="flex h-9 items-center rounded-md border px-3 text-sm">
                <Bone w={widthFor(i, 1)} />
              </div>
              <div className="h-9 rounded-md border sm:w-52" />
              <div className="flex h-9 items-center rounded-md border px-3 text-sm">
                <Bone w={widthFor(i, 4)} />
              </div>
              <div className="flex gap-1 px-3 text-sm text-muted-foreground">
                <span className="px-1">Save</span>
                <span className="px-1">Delete</span>
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <Section
        id="rules"
        title="Rules"
        description="Learned when you change a category and tick “Always do this”. Rules apply before the AI, so these merchants are never guessed."
      >
        <ul className="divide-y border-y">
          {times(4, (i) => (
            <li key={i} className="py-2 text-sm">
              <Bone w={widthFor(i, 2)} />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

async function Settings() {
  const [{ accounts, categories, rules, notes }, state] = await Promise.all([
    getExpenseSettings(),
    getExpensesState(),
  ]);
  return (
    <div className="grid gap-12">
      <Section
        id="accounts"
        title="Accounts"
        description="Only included accounts are analysed. Including one labels its last six months; excluding one takes it out of the totals."
      >
        <ul className="mb-3 grid gap-2">
          {accounts.map((a) => (
            <li
              key={a.accountId}
              className="flex flex-wrap items-baseline gap-2"
            >
              <AccountToggle
                accountId={a.accountId}
                included={a.included}
                name={a.name}
              />
              <span className="text-xs text-muted-foreground">
                {a.productName}
              </span>
            </li>
          ))}
        </ul>
        <RefreshAccountsButton />
      </Section>

      <Section
        id="categories"
        title="Categories"
        description="The AI reads each description to decide what goes where. A category can only be deleted once nothing uses it."
      >
        <CategoryEditor categories={categories} />
      </Section>

      <Section
        id="rules"
        title="Rules"
        description="Learned when you change a category and tick “Always do this”. Rules apply before the AI, so these merchants are never guessed."
      >
        {rules.length ? (
          <ul className="divide-y border-y">
            {rules.map(({ rule, category }) => (
              <li
                key={rule.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {rule.pattern}
                  </code>{" "}
                  → {category}
                  {rule.deductible ? (
                    <span className="text-muted-foreground"> · deductible</span>
                  ) : null}
                </span>
                <DeleteRuleButton id={rule.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No rules yet.</p>
        )}
      </Section>

      <Section
        id="notes"
        title="Notes"
        description="Anything the AI should know that a rule can't say. It reads these on every run."
      >
        {notes.length ? (
          <ul className="mb-4 divide-y border-y">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex items-start justify-between gap-2 py-2 text-sm"
              >
                <span className="whitespace-pre-line">{note.body}</span>
                <DeleteNoteButton id={note.id} />
              </li>
            ))}
          </ul>
        ) : null}
        <NoteForm />
      </Section>

      <p className="text-xs text-muted-foreground">
        Classifier:{" "}
        {state.ai
          ? "Claude Haiku 5.5 via Vercel AI Gateway. It sees descriptions, amounts and transaction types, never account numbers or balances."
          : "offline keyword matching (no AI Gateway credentials here)."}
      </p>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}
