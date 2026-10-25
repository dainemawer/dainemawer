"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteRecurring, setRecurringPaused } from "@/lib/actions/recurring";

export function RecurringActions({
  id,
  paused,
}: {
  id: string;
  paused: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ error?: string }>, success?: string) =>
    startTransition(async () => {
      const result = await action();
      if (result?.error) toast.error(result.error);
      else if (success) toast.success(success);
    });

  return (
    <>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          run(
            () => setRecurringPaused(id, !paused),
            paused ? "Resumed." : "Paused. No invoices until you resume it.",
          )
        }
      >
        {paused ? "Resume" : "Pause"}
      </Button>
      <Button asChild variant="outline">
        <Link href={`/recurring/${id}/edit`}>Edit</Link>
      </Button>
      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => {
          if (
            confirm(
              "Delete this recurring invoice? Invoices it already created are kept.",
            )
          ) {
            run(() => deleteRecurring(id));
          }
        }}
      >
        Delete
      </Button>
    </>
  );
}
