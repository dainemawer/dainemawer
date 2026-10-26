"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relabelTransaction } from "@/lib/actions/expenses";
import { type LabelSource, suggestPattern } from "@/lib/expenses/transactions";
import { cn } from "@/lib/utils";

export type CategoryOption = { id: string; name: string };

const SOURCE: Record<LabelSource, string> = {
  rule: "From one of your rules",
  ai: "Suggested by the AI",
  you: "Set by you",
};

/**
 * The category on a transaction row; opens a dialog to change it. Changing
 * it can also teach a rule ("always do this for …"), which is how the
 * classifier's memory grows.
 */
export function LabelButton({
  transaction,
  label,
  categories,
}: {
  transaction: {
    id: string;
    accountId: string;
    description: string;
    type: "DEBIT" | "CREDIT";
  };
  label: {
    categoryId: string;
    deductible: boolean;
    source: LabelSource;
    confidence: number | null;
    needsReview: boolean;
  } | null;
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(label?.categoryId ?? "");
  const [deductible, setDeductible] = useState(label?.deductible ?? false);
  const [remember, setRemember] = useState(true);
  const [pattern, setPattern] = useState(() =>
    suggestPattern(transaction.description),
  );
  const [pending, startTransition] = useTransition();
  const current = categories.find((c) => c.id === label?.categoryId);

  const save = () =>
    startTransition(async () => {
      const result = await relabelTransaction({
        transactionId: transaction.id,
        accountId: transaction.accountId,
        description: transaction.description,
        categoryId,
        deductible,
        remember: remember ? pattern : undefined,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success(
        result.applied
          ? `Saved, and applied to ${result.applied} other transaction${result.applied === 1 ? "" : "s"}.`
          : "Saved.",
      );
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-left text-xs hover:border-ink/40",
            !current && "border-dashed text-muted-foreground",
            label?.needsReview && "border-warning/50 bg-warning/5",
          )}
        >
          <span className="truncate">{current?.name ?? "Unlabelled"}</span>
          {label?.deductible ? (
            <span className="text-2xs text-muted-foreground">· deductible</span>
          ) : null}
          <span className="sr-only">, change category</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Category</DialogTitle>
          <DialogDescription className="break-words">
            {transaction.description}
            {label ? (
              <>
                <br />
                {SOURCE[label.source]}
                {label.source === "ai" && label.confidence !== null
                  ? ` (${Math.round(label.confidence * 100)}% sure)`
                  : ""}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <Field id={`category-${transaction.id}`} label="Category">
            <Select
              value={categoryId || undefined}
              onValueChange={setCategoryId}
            >
              <SelectTrigger
                id={`category-${transaction.id}`}
                className="w-full"
              >
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {transaction.type === "DEBIT" ? (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-ink"
                checked={deductible}
                onChange={(e) => setDeductible(e.target.checked)}
              />
              <span>
                Deductible business expense
                <span className="block text-xs text-muted-foreground">
                  Counts towards your tax-year total.
                </span>
              </span>
            </label>
          ) : null}
          <div className="grid gap-2">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-ink"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>
                Always do this for descriptions containing…
                <span className="block text-xs text-muted-foreground">
                  Also relabels past ones, except any you set yourself.
                </span>
              </span>
            </label>
            {remember ? (
              <Input
                aria-label="Descriptions containing"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="ml-6 w-auto"
              />
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={save}
            disabled={pending || !categoryId || (remember && !pattern.trim())}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
