"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ImportOutcome, importFromZoho } from "@/lib/actions/import";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Pick the exports, preview, import. The files stay in state (not the
 * form), so Import sends the same files the preview read.
 */
export function ZohoImport() {
  const [files, setFiles] = useState<File[]>([]);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (commit: boolean) =>
    startTransition(async () => {
      const data = new FormData();
      for (const file of files) data.append("files", file);
      if (commit) data.set("commit", "1");
      const result = await importFromZoho(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOutcome(result);
      if (result.committed) toast.success("Imported.");
    });

  const newCustomers = outcome?.customers?.filter((c) => !c.existing) ?? [];
  const newDocuments =
    outcome?.documents?.filter((d) => !d.alreadyImported) ?? [];
  const nothingNew = !newCustomers.length && !newDocuments.length;

  return (
    <div className="grid max-w-4xl gap-10">
      <section className="grid gap-4">
        <ol className="grid list-decimal gap-1 pl-5 text-sm text-muted-foreground">
          <li>
            In Zoho Invoice, export <strong>Customers</strong>,{" "}
            <strong>Invoices</strong>, <strong>Quotes</strong> and{" "}
            <strong>Payments Received</strong> as CSV (each list&rsquo;s ⋯ menu
            → Export, all dates).
          </li>
          <li>Choose all four files here and preview.</li>
          <li>
            Check the numbers each document gets, then import. Running it again
            skips anything already imported.
          </li>
        </ol>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="file"
            accept=".csv,text/csv"
            multiple
            aria-label="Zoho CSV exports"
            className="max-w-sm"
            onChange={(event) => {
              setFiles([...(event.target.files ?? [])]);
              setOutcome(null);
            }}
          />
          <Button
            variant="outline"
            disabled={!files.length || pending}
            onClick={() => run(false)}
          >
            {pending && !outcome ? "Reading…" : "Preview"}
          </Button>
        </div>
      </section>

      {outcome ? (
        <>
          {outcome.unknownFiles?.length ? (
            <Notice tone="muted">
              Not a Zoho export, so ignored: {outcome.unknownFiles.join(", ")}.
            </Notice>
          ) : null}
          {outcome.problems?.length ? (
            <Notice tone="destructive" title="Won't import">
              {outcome.problems}
            </Notice>
          ) : null}
          {outcome.warnings?.length ? (
            <Notice tone="warning" title="Imports, but check">
              {outcome.warnings}
            </Notice>
          ) : null}

          <section className="grid gap-3">
            <h2 className="text-lg font-bold">Customers</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>In the admin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outcome.customers?.map((customer) => (
                  <TableRow key={customer.company}>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.existing
                        ? "Already there, left as is"
                        : outcome.committed
                          ? "Added"
                          : "New"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          <section className="grid gap-3">
            <h2 className="text-lg font-bold">Quotes and invoices</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zoho</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outcome.documents?.map((doc) => (
                  <TableRow key={`${doc.kind}-${doc.zohoNumber}`}>
                    <TableCell className="tabular-nums">
                      {doc.zohoNumber}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {doc.number}
                      {doc.alreadyImported ? (
                        <span className="text-muted-foreground">
                          {" "}
                          (imported before)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{doc.company}</TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(doc.totalMinor, doc.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {outcome.committed ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/invoices">View invoices</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/quotes">View quotes</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/customers">View customers</Link>
              </Button>
            </div>
          ) : nothingNew ? (
            <p className="text-sm text-muted-foreground">
              Everything here is already in the admin.
            </p>
          ) : (
            <div>
              <Button disabled={pending} onClick={() => run(true)}>
                {pending
                  ? "Importing…"
                  : `Import ${count(newCustomers.length, "customer")} and ${count(newDocuments.length, "document")}`}
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

function Notice({
  tone,
  title,
  children,
}: {
  tone: "destructive" | "warning" | "muted";
  title?: string;
  children: React.ReactNode | string[];
}) {
  const tones = {
    destructive: "border-destructive/40 bg-destructive/5 text-destructive",
    warning: "border-warning/40 bg-warning/5 text-warning",
    muted: "text-muted-foreground",
  };
  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone])}>
      {title ? <p className="mb-1 font-medium">{title}</p> : null}
      {Array.isArray(children) ? (
        <ul className="grid list-disc gap-1 pl-5">
          {children.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        children
      )}
    </div>
  );
}
