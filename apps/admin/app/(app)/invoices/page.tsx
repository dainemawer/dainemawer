import type { Metadata } from "next";
import { DocumentListPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage({
  searchParams,
}: PageProps<"/invoices">) {
  const { status } = await searchParams;
  return (
    <DocumentListPage
      kind="invoice"
      status={typeof status === "string" ? status : undefined}
    />
  );
}
