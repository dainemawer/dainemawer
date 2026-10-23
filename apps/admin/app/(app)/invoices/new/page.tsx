import type { Metadata } from "next";
import { NewDocumentPage } from "@/components/document-pages";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage({
  searchParams,
}: PageProps<"/invoices/new">) {
  const { customer } = await searchParams;
  return (
    <NewDocumentPage
      kind="invoice"
      customerId={typeof customer === "string" ? customer : undefined}
    />
  );
}
