"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmLabels,
  deleteNote,
  deleteRule,
  refreshAccounts,
  saveNote,
  setAccountIncluded,
  syncNow,
} from "@/lib/actions/expenses";

type Result = { error?: string };

function useAction() {
  const [pending, startTransition] = useTransition();
  const run = <R extends Result>(
    action: () => Promise<R>,
    success?: (result: R) => string | undefined,
  ) =>
    startTransition(async () => {
      const result = await action();
      if (result?.error) toast.error(result.error);
      else {
        const message = success?.(result);
        if (message) toast.success(message);
      }
    });
  return [pending, run] as const;
}

export function SyncButton() {
  const [pending, run] = useAction();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        run(syncNow, (r) =>
          r.labelled
            ? `${r.labelled} new transaction${r.labelled === 1 ? "" : "s"} labelled${r.review ? `, ${r.review} to review` : ""}.`
            : "Up to date.",
        )
      }
    >
      {pending ? "Syncing…" : "Sync now"}
    </Button>
  );
}

/** "Looks right": accept the classifier's labels as they are. */
export function ConfirmButton({
  ids,
  children,
  variant = "outline",
}: {
  ids: string[];
  children: React.ReactNode;
  variant?: "outline" | "default" | "ghost";
}) {
  const [pending, run] = useAction();
  return (
    <Button
      variant={variant}
      size="sm"
      disabled={pending || !ids.length}
      onClick={() => run(() => confirmLabels(ids))}
    >
      {children}
    </Button>
  );
}

export function AccountToggle({
  accountId,
  included,
  name,
}: {
  accountId: string;
  included: boolean;
  name: string;
}) {
  const [pending, run] = useAction();
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 accent-ink"
        checked={included}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.checked;
          run(() => setAccountIncluded(accountId, next));
        }}
      />
      {name}
      {pending ? (
        <span className="text-xs text-muted-foreground">Updating…</span>
      ) : null}
    </label>
  );
}

export function RefreshAccountsButton() {
  const [pending, run] = useAction();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => run(refreshAccounts)}
    >
      {pending ? "Checking Investec…" : "Refresh accounts"}
    </Button>
  );
}

export function DeleteRuleButton({ id }: { id: string }) {
  const [pending, run] = useAction();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => run(() => deleteRule(id))}
    >
      Remove
    </Button>
  );
}

export function DeleteNoteButton({ id }: { id: string }) {
  const [pending, run] = useAction();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => run(() => deleteNote(id))}
    >
      Remove
    </Button>
  );
}

export function NoteForm() {
  const [pending, run] = useAction();
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const body = ref.current?.value ?? "";
        run(
          async () => {
            const result = await saveNote(body);
            if (!result.error && ref.current) ref.current.value = "";
            return result;
          },
          () => "Noted. The classifier reads it from the next run.",
        );
      }}
    >
      <Textarea
        ref={ref}
        aria-label="New note"
        rows={2}
        maxLength={500}
        placeholder="e.g. Checkers Sixty60 on weekdays is lunch at the office, so Eating out."
      />
      <div>
        <Button type="submit" size="sm" disabled={pending}>
          Add note
        </Button>
      </div>
    </form>
  );
}
