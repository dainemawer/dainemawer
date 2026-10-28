"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Field, invalid } from "@/components/field";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  convertToInvoice,
  deleteDocument,
  duplicateDocument,
  markPaid,
  setStatus,
} from "@/lib/actions/documents";
import { initialFormState } from "@/lib/actions/form-state";
import { sendDocument } from "@/lib/actions/send";
import {
  allowedActions,
  type DocumentKind,
  MANUAL_STATUSES,
  type StoredStatus,
  statusTargets,
  todayISO,
} from "@/lib/documents";

type EmailDefaults = { to: string; cc: string; subject: string; body: string };

export function DocumentActions({
  id,
  kind,
  status,
  emailDefaults,
  hasBeenSent,
}: {
  id: string;
  kind: DocumentKind;
  status: StoredStatus;
  emailDefaults: EmailDefaults;
  hasBeenSent: boolean;
}) {
  const allowed = allowedActions(kind, status);
  const targets = statusTargets(kind, status);
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState(false);
  const path = `/${kind === "quote" ? "quotes" : "invoices"}/${id}`;

  // Actions that redirect (convert, duplicate, delete) navigate away on
  // success; the rest come back with an optional error to show.
  const run = (action: () => Promise<{ error?: string }>, success?: string) =>
    startTransition(async () => {
      const result = await action();
      if (result?.error) toast.error(result.error);
      else if (success) toast.success(success);
    });

  const changeStatus = (target: StoredStatus) => {
    if (target === status) return;
    if (target === "paid") return setPaying(true);
    if (
      target === "void" &&
      !confirm(
        "Void this invoice? It keeps its number but drops out of every total.",
      )
    ) {
      return;
    }
    run(
      () => setStatus(id, target),
      target === "sent"
        ? "Marked sent. Nothing was emailed."
        : `Marked ${target}.`,
    );
  };

  return (
    <>
      {allowed.send ? (
        <SendDialog
          id={id}
          kind={kind}
          defaults={emailDefaults}
          resend={hasBeenSent}
        />
      ) : null}
      {allowed.accept ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(() => setStatus(id, "accepted"), "Marked accepted.")
          }
        >
          Mark accepted
        </Button>
      ) : null}
      {allowed.convert ? (
        <Button
          variant={status === "accepted" ? "default" : "outline"}
          disabled={pending}
          onClick={() => run(() => convertToInvoice(id))}
        >
          Convert to invoice
        </Button>
      ) : null}
      {allowed.markPaid ? (
        <MarkPaidDialog id={id} open={paying} onOpenChange={setPaying} />
      ) : null}
      {allowed.edit ? (
        <Button asChild variant="outline">
          <Link href={`${path}/edit`}>Edit</Link>
        </Button>
      ) : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="More actions"
            disabled={pending}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/documents/${id}/pdf?download=1`}>Download PDF</a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => run(() => duplicateDocument(id))}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={status}
                onValueChange={(value) => changeStatus(value as StoredStatus)}
              >
                {MANUAL_STATUSES[kind].map((option) => (
                  <DropdownMenuRadioItem
                    key={option}
                    value={option}
                    disabled={option !== status && !targets.includes(option)}
                    className="capitalize"
                  >
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {allowed.delete ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                if (confirm("Delete this draft quote? This can't be undone.")) {
                  run(() => deleteDocument(id));
                }
              }}
            >
              Delete draft
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function SendDialog({
  id,
  kind,
  defaults,
  resend,
}: {
  id: string;
  kind: DocumentKind;
  defaults: EmailDefaults;
  resend: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    sendDocument.bind(null, id),
    initialFormState,
  );
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success(`${kind === "quote" ? "Quote" : "Invoice"} sent.`);
    }
  }, [state, kind]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{resend ? "Send again" : `Send ${kind}`}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send {kind}</DialogTitle>
          <DialogDescription>
            Sent from billing@dainemawer.com with the PDF attached. You're
            copied in.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <Field id="send-to" label="To" errors={errors.to}>
            <Input
              id="send-to"
              name="to"
              defaultValue={defaults.to}
              {...invalid("send-to", errors.to)}
            />
          </Field>
          <Field id="send-cc" label="CC" errors={errors.cc}>
            <Input
              id="send-cc"
              name="cc"
              defaultValue={defaults.cc}
              {...invalid("send-cc", errors.cc)}
            />
          </Field>
          <Field id="send-subject" label="Subject" errors={errors.subject}>
            <Input
              id="send-subject"
              name="subject"
              defaultValue={defaults.subject}
              {...invalid("send-subject", errors.subject)}
            />
          </Field>
          <Field id="send-body" label="Message" errors={errors.body}>
            <Textarea
              id="send-body"
              name="body"
              rows={9}
              defaultValue={defaults.body}
              {...invalid("send-body", errors.body)}
            />
          </Field>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Opened by its own button, or from Change status → Paid. */
function MarkPaidDialog({
  id,
  open,
  onOpenChange: setOpen,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, action, pending] = useActionState(
    markPaid.bind(null, id),
    initialFormState,
  );
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
      toast.success("Marked paid.");
    }
  }, [state, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Mark paid</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark paid</DialogTitle>
          <DialogDescription>Record when the money arrived.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <Field id="paidAt" label="Paid on" errors={errors.paidAt}>
            <Input
              id="paidAt"
              name="paidAt"
              type="date"
              required
              defaultValue={todayISO()}
              {...invalid("paidAt", errors.paidAt)}
            />
          </Field>
          <Field
            id="paymentRef"
            label="Reference"
            hint="Optional, e.g. the bank reference."
          >
            <Input id="paymentRef" name="paymentRef" />
          </Field>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Mark paid"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
