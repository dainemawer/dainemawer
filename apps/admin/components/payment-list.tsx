"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removePayment } from "@/lib/actions/payments";

/** An invoice's payments, each removable (a mistake, a bounced transfer). */
export function PaymentList({
  payments,
  locked,
}: {
  payments: {
    id: string;
    amount: string;
    date: string;
    reference: string | null;
  }[];
  /** A void invoice's payments stay as they are. */
  locked: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <ol className="grid gap-3">
      {payments.map((payment) => (
        <li
          key={payment.id}
          className="flex items-start justify-between gap-3 border-t pt-3 text-sm"
        >
          <div className="min-w-0">
            <div className="font-medium tabular-nums">{payment.amount}</div>
            <div className="truncate text-muted-foreground">
              {payment.date}
              {payment.reference ? ` · ${payment.reference}` : ""}
            </div>
          </div>
          {locked ? null : (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              className="text-muted-foreground"
              onClick={() => {
                if (!confirm(`Remove the payment of ${payment.amount}?`))
                  return;
                startTransition(async () => {
                  const result = await removePayment(payment.id);
                  if (result.error) toast.error(result.error);
                  else toast.success("Payment removed.");
                });
              }}
            >
              Remove
              <span className="sr-only">
                {" "}
                payment of {payment.amount} on {payment.date}
              </span>
            </Button>
          )}
        </li>
      ))}
    </ol>
  );
}
